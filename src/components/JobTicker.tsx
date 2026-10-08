import { useEffect, useState } from 'react'
import { Megaphone } from 'lucide-react'
import { fetchJobOpportunities } from '../lib/jobOpportunities'
import type { JobOpportunity } from '../types/database'

export function JobTicker() {
  const [posts, setPosts] = useState<JobOpportunity[]>([])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    let active = true
    fetchJobOpportunities()
      .then((data) => {
        if (active) setPosts(data)
      })
      .catch(() => {
        /* the ticker is non-critical on the landing page */
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (posts.length <= 1) return
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % posts.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [posts.length])

  if (posts.length === 0) return null

  const post = posts[index]

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
        <Megaphone className="w-4 h-4 text-blue-400" />
        Latest opportunities
      </h2>
      <div
        key={post.id}
        className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl p-4 flex items-center gap-4 animate-[fadeInUp_0.4s_ease-out]"
      >
        {post.photo_url ? (
          <img
            src={post.photo_url}
            alt={post.company_name}
            className="w-14 h-14 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 text-lg font-bold text-slate-400">
            {post.company_name.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{post.role_title}</p>
          <p className="text-xs text-blue-300 truncate">{post.company_name}</p>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{post.description}</p>
        </div>
      </div>
      {posts.length > 1 && (
        <div className="flex gap-1.5 justify-center">
          {posts.map((p, i) => (
            <span
              key={p.id}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-5 bg-blue-400' : 'w-1.5 bg-slate-600'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
