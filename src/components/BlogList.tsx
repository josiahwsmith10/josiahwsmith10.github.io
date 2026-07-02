import { useEffect, useMemo, useState } from 'react';

export interface PostCard {
  slug: string;
  title: string;
  description: string;
  dateLabel: string;
  dateISO: string;
  ts: number;
  minutes: number;
  tags: string[];
}

interface Props {
  posts: PostCard[];
  allTags: string[];
}

type Sort = 'new' | 'old' | 'az';

export default function BlogList({ posts, allTags }: Props) {
  const [tag, setTag] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('new');

  // Honor a ?tag= deep link (e.g. from a post's category chip) after hydration.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tag');
    if (t && allTags.includes(t)) setTag(t);
  }, [allTags]);

  const shown = useMemo(() => {
    const filtered = tag ? posts.filter((p) => p.tags.includes(tag)) : posts;
    const sorted = [...filtered].sort((a, b) => {
      if (sort === 'az') return a.title.localeCompare(b.title);
      return sort === 'old' ? a.ts - b.ts : b.ts - a.ts;
    });
    return sorted;
  }, [posts, tag, sort]);

  return (
    <div className="bloglist">
      <div className="bloglist__bar">
        <div className="bloglist__tags" role="group" aria-label="Filter by topic">
          <button
            type="button"
            className={'tagbtn' + (tag === null ? ' is-on' : '')}
            aria-pressed={tag === null}
            onClick={() => setTag(null)}
          >
            All
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              className={'tagbtn' + (tag === t ? ' is-on' : '')}
              aria-pressed={tag === t}
              onClick={() => setTag(tag === t ? null : t)}
            >
              {t}
            </button>
          ))}
        </div>
        <label className="bloglist__sort">
          <span className="bloglist__sortlabel">Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="new">Newest</option>
            <option value="old">Oldest</option>
            <option value="az">A–Z</option>
          </select>
        </label>
      </div>

      <p className="bloglist__count" aria-live="polite">
        {shown.length} {shown.length === 1 ? 'post' : 'posts'}
        {tag ? ` · ${tag}` : ''}
      </p>

      <ul className="bloglist__list">
        {shown.map((p) => (
          <li key={p.slug} className="postcard">
            <div className="postcard__meta">
              <time dateTime={p.dateISO}>{p.dateLabel}</time>
              <span className="dot">·</span>
              <span>{p.minutes} min</span>
            </div>
            <h2 className="postcard__title">
              <a href={`/blog/${p.slug}`}>{p.title}</a>
            </h2>
            <p className="postcard__desc">{p.description}</p>
            <div className="postcard__tags">
              {p.tags.map((t) => (
                <button key={t} type="button" className="postcard__tag" onClick={() => setTag(t)}>
                  {t}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
