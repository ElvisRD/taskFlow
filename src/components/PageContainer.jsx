export function PageContainer({ wide = false, className = '', children }) {
  return (
    <div
      className={`mx-auto flex w-full flex-1 flex-col ${
        wide ? 'max-w-none px-4 py-6 sm:px-6' : 'max-w-7xl px-4 py-6 sm:px-6 lg:py-8'
      } ${className}`}
    >
      {children}
    </div>
  )
}
