import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-lg place-items-center px-4 py-24 text-center">
      <div className="text-6xl font-black text-white/10">404</div>
      <h1 className="mt-2 text-2xl font-extrabold text-white">Lost in the graph?</h1>
      <p className="mt-2 text-sm text-slate-400">That route doesn't exist. Head back to a known node.</p>
      <div className="mt-6 flex gap-2">
        <Link to="/" className="btn-primary">Home</Link>
        <Link to="/studio" className="btn-ghost">Studio</Link>
        <Link to="/templates" className="btn-ghost">Templates</Link>
      </div>
    </div>
  )
}
