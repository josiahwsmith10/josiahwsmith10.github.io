--[[
  multibib.lua — render several independent bibliographies in one document.

  Pandoc's citeproc produces a single bibliography per pass, so it can't emit
  the grouped "Journal / Letters / Conference / ..." lists a CV wants. This
  filter runs citeproc once per entry in the `multibib` metadata map, formatting
  each with the document CSL (IEEE here), and drops the result into the matching
  `::: {#refs-<id>}` div.

  Front matter:
      csl: ieee.csl
      citeproc: false            # we call citeproc ourselves, below
      filters:
        - _filters/multibib.lua
      multibib:
        journal: references-journal.bib
        conference: references-conference.bib

  Body:
      ### Journal articles
      ::: {#refs-journal}
      :::
]]

-- A `nocite: @*` value so every entry in a bib is listed without inline citing.
local function nocite_all()
  return pandoc.MetaInlines(pandoc.Inlines{
    pandoc.Cite(
      pandoc.Inlines{ pandoc.Str("[@*]") },
      pandoc.List{ pandoc.Citation("*", "NormalCitation") }
    )
  })
end

function Pandoc(doc)
  local mb = doc.meta.multibib
  if mb == nil or pandoc.utils.type(mb) ~= "table" then
    return nil -- nothing to do
  end

  -- Render each named bibliography on its own.
  local rendered = {}
  for id, path in pairs(mb) do
    local submeta = {}
    for k, v in pairs(doc.meta) do submeta[k] = v end
    submeta.bibliography = pandoc.utils.stringify(path)
    submeta.nocite = nocite_all()
    submeta.multibib = nil

    local placeholder = pandoc.Div(pandoc.Blocks{}, pandoc.Attr("refs"))
    local processed = pandoc.utils.citeproc(pandoc.Pandoc(pandoc.Blocks{ placeholder }, submeta))

    -- Give the generated bibliography div a unique id (avoid repeated #refs).
    for _, blk in ipairs(processed.blocks) do
      if blk.t == "Div" and blk.identifier == "refs" then
        blk.identifier = "refs-" .. id
      end
    end
    rendered[id] = processed.blocks
  end

  -- Swap each ::: {#refs-<id>} placeholder for its rendered list.
  return doc:walk{
    Div = function(div)
      if div.identifier and div.identifier:match("^refs%-") then
        local id = div.identifier:sub(6)
        if rendered[id] then
          return rendered[id]
        end
      end
    end
  }
end
