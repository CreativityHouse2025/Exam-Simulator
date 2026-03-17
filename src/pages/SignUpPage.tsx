import React from "react"
import { Link } from "react-router-dom"

const SignUpPage: React.FC = () => {
  return (
    <div>
      <h1>Sign Up</h1>
      <p style={{ fontSize: '2rem' }}>
        Already have an account? <Link to="/signin">Sign In</Link>
      </p>
    </div>
  )
}

export default SignUpPage
