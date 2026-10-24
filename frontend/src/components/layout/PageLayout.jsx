/**
 * Wraps page content with consistent padding accounting for
 * the fixed top bar (h-14) and desktop sidebar (w-56).
 */
export default function PageLayout({ title, subtitle, children, actions }) {
  return (
    <div className="min-h-screen pt-14 lg:pl-56">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Page header */}
        {(title || actions) && (
          <div className="flex items-start justify-between mb-6 gap-4">
            <div>
              {title && (
                <h1 className="text-xl font-semibold text-white">{title}</h1>
              )}
              {subtitle && (
                <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
