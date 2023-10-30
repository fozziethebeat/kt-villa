import { useRef } from 'react'
import { useEffect } from 'react'

import {
  Form,
  Label,
  TextField,
  PasswordField,
  Submit,
  FieldError,
} from '@redwoodjs/forms'
import { Link, navigate, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'
import { toast, Toaster } from '@redwoodjs/web/toast'

import { useAuth } from 'src/auth'

const LoginPage = () => {
  const { isAuthenticated, logIn } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      navigate(routes.home())
    }
  }, [isAuthenticated])

  const usernameRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    usernameRef.current?.focus()
  }, [])

  const onSubmit = async (data: Record<string, string>) => {
    const response = await logIn({
      username: data.username,
      password: data.password,
    })

    if (response.message) {
      toast(response.message)
    } else if (response.error) {
      toast.error(response.error)
    } else {
      toast.success('Welcome back!')
    }
  }

  return (
    <>
      <MetaTags title="Login" />

      <main className="rw-main">
        <Toaster toastOptions={{ className: 'rw-toast', duration: 6000 }} />
        <div className="rw-scaffold rw-login-container">
          <div className="rw-segment">
            <header className="rw-segment-header">
              <h2 className="rw-heading rw-heading-secondary">Login</h2>
            </header>

            <div className="rw-segment-main">
              <div className="rw-form-wrapper">
                <Form onSubmit={onSubmit} className="rw-form-wrapper">
                  <div className="form-control w-full max-w-xs">
                    <label name="username" className="label">
                      <span className="label-text">Username</span>
                    </label>
                    <TextField
                      name="username"
                      className="input input-bordered w-full max-w-xs"
                      ref={usernameRef}
                      validation={{
                        required: {
                          value: true,
                          message: 'Username is required',
                        },
                      }}
                    />
                    <label className="label">
                      <FieldError name="username" className="label-text-alt" />
                    </label>
                  </div>

                  <div className="form-control w-full max-w-xs">
                    <label name="password" className="label">
                      <span className="label-text">Password</span>
                    </label>
                    <PasswordField
                      name="password"
                      className="input input-bordered w-full max-w-xs"
                      autoComplete="current-password"
                      validation={{
                        required: {
                          value: true,
                          message: 'Password is required',
                        },
                      }}
                    />
                    <label className="label">
                      <FieldError name="password" className="label-text-alt" />
                    </label>
                  </div>

                  <div className="rw-forgot-link">
                    <Link to={routes.forgotPassword()} className="link">
                      Forgot Password?
                    </Link>
                  </div>

                  <div className="rw-button-group">
                    <Submit className="btn btn-primary">Login</Submit>
                  </div>
                </Form>
              </div>
            </div>
          </div>
          <div className="m-2">
            <span>Don&apos;t have an account?</span>{' '}
            <Link to={routes.signup()} className="link">
              Sign up!
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}

export default LoginPage
