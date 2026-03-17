import React from "react"
import { Link } from "react-router-dom"

const SignInPage: React.FC = () => {
  return (
    <div>
      <h1>Sign In</h1>
      <p style={{ fontSize: '2rem' }}>
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </div>
  )
}

export default SignInPage
