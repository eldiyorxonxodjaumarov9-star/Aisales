export function PageLoader({ full }: { full?: boolean }) {
  return (
    <div className="page-loader" style={full ? { minHeight: '100vh' } : undefined} role="status" aria-label="Sahifa yuklanmoqda">
      <span className="spinner" />
    </div>
  )
}
