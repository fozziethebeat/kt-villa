import { useAuth } from 'src/auth'
import { Link, routes } from '@redwoodjs/router'

type GeneralLayoutProps = {
  children?: React.ReactNode
}

const GeneralLayout = ({ children }: GeneralLayoutProps) => {
  const { hasRole } = useAuth()
  return (
    <>
      <header className="navbar bg-base-100">
        <div className="flex-1">
          <a className="norma-case btn btn-ghost text-xl">
            <Link to={routes.home()}>Surface Stay</Link>
          </a>
        </div>
        <nav className="flex-none">
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="avatar btn btn-circle btn-ghost">
              <div className="w-10 rounded-full">
                <img src="https://avatars.githubusercontent.com/u/398211?v=4" />
              </div>
            </label>

            <ul
              tabIndex={0}
              className="menu dropdown-content rounded-box menu-sm z-[1] mt-3 w-52 bg-base-100 p-2 shadow"
            >
              <li>
                <Link to={routes.home()}>Home</Link>
              </li>
              <li>
                <Link to={routes.about()}>About</Link>
              </li>
              {hasRole('admin') && (
                <>
                  <div className="divider" />
                  <li>
                    <Link to={routes.adminNewStableItem()}>Add Item</Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </nav>
      </header>
      <main>{children}</main>
    </>
  )
}

export default GeneralLayout
