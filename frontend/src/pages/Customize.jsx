import React, { useContext, useRef, useState } from 'react'
import Card from '../components/Card'
import image1 from "../assets/image1.png"
import image2 from "../assets/image2.jpg"
import image3 from "../assets/authBg.png"
import image4 from "../assets/image4.png"
import image5 from "../assets/image5.png"
import image6 from "../assets/image6.jpeg"
import image7 from "../assets/image7.jpeg"
import { RiImageAddLine } from "react-icons/ri";
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import { MdKeyboardBackspace } from "react-icons/md";

// Define gender for each preset image — change 'male'/'female' as per your images
const presetImages = [
  { image: image1, gender: 'female' },
  { image: image2, gender: 'female' },
  { image: image3, gender: 'female' },
  { image: image4, gender: 'male' },
  { image: image5, gender: 'male' },
  { image: image6, gender: 'female' },
  { image: image7, gender: 'male' },
]

function Customize() {
  const {serverUrl,userData,setUserData,backendImage,setBackendImage,frontendImage,setFrontendImage,selectedImage,setSelectedImage,setSelectedGender}=useContext(userDataContext)
  const navigate=useNavigate()
  const inputImage=useRef()

  const handleImage=(e)=>{
    const file=e.target.files[0]
    setBackendImage(file)
    setFrontendImage(URL.createObjectURL(file))
  }

  return (
    <div className='w-full h-screen bg-gradient-to-t from-black to-blue-900 flex justify-center items-center flex-col p-5 '>
        <MdKeyboardBackspace className='absolute top-[30px] left-[30px] text-white cursor-pointer w-[25px] h-[25px]' onClick={()=>navigate("/")}/>
        <h1 className='text-white mb-10 text-[30px] text-center '>Select your <span className='text-blue-200'>Assistant Image</span></h1>
        <div className='w-full max-w-[900px] flex justify-center items-center flex-wrap gap-[15px]'>
          {presetImages.map((item, index) => (
            <Card key={index} image={item.image} gender={item.gender} />
          ))}
          <div className={`w-[70px] h-[140px] lg:w-[150px] lg:h-[250px] bg-[#020220] border-2 border-[#0000ff66] rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-blue-950 cursor-pointer hover:border-4 hover:border-white flex items-center justify-center ${selectedImage=="input"?"border-4 border-white shadow-2xl shadow-blue-950 ":null}`} onClick={()=>{
            inputImage.current.click()
            setSelectedImage("input")
            setSelectedGender('female')
          }}>
            {!frontendImage && <RiImageAddLine className='text-white w-[25px] h-[25px]'/>}
            {frontendImage && <img src={frontendImage} className='h-full object-cover'/>}
          </div>
          <input type="file" accept='image/*' ref={inputImage} hidden onChange={handleImage}/>
        </div>
        {selectedImage && <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold cursor-pointer bg-white rounded-full text-[19px] ' onClick={()=>navigate("/customize2")}>Next</button>}
    </div>
  )
}

export default Customize
