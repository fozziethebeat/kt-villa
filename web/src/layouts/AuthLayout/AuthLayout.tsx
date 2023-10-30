import { useEffect } from 'react'
import { themeChange } from 'theme-change'

type AuthLayoutProps = {
  children?: React.ReactNode
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  useEffect(() => {
    themeChange(false)
  }, [])
  return <>{children}</>
}

export default AuthLayout
