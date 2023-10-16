import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

import AdminGenerateImageForm from 'src/components/AdminGenerateImageForm'
const GenerateImagePage = () => {
  return (
    <>
      <MetaTags title="GenerateImage" description="GenerateImage page" />

      <AdminGenerateImageForm />
    </>
  )
}

export default GenerateImagePage
