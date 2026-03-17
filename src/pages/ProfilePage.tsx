import React from "react"
import { Link } from "react-router-dom"

const ProfilePage: React.FC = () => {
  return (
    <div>
      <h1>Profile</h1>
      <p style={{ fontSize: '2rem' }}>
        <Link to="/app">Back to App</Link>
      </p>
    </div>
  )
}

export default ProfilePage
