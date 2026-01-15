import React, { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import Customize from './pages/Customize'
import { userDataContext } from './context/UserContext'
import Home from './pages/Home'
import Customize2 from './pages/Customize2'

function App() {
  const {userData,loadingUser}=useContext(userDataContext)
  
  if (loadingUser) {
    return <div className="w-full h-screen flex items-center justify-center bg-black text-white">Loading...</div>
  }
  
  const hasAssistant = userData?.assistantName && userData?.assistantImage;
  
  return (
   <Routes>
     <Route path='/' element={
       userData ? 
         (hasAssistant ? <Home/> : <Navigate to={"/customize"}/>) : 
         <Navigate to={"/signup"}/>
     }/>
    <Route path='/signup' element={!userData?<SignUp/>:<Navigate to={"/"}/>}/>
     <Route path='/signin' element={!userData?<SignIn/>:<Navigate to={"/"}/>}/>
      <Route path='/customize' element={userData?<Customize/>:<Navigate to={"/signup"}/>}/>
       <Route path='/customize2' element={userData?<Customize2/>:<Navigate to={"/signup"}/>}/>
   </Routes>
  )
}

export default App
