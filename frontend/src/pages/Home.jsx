import React, { useContext, useEffect, useRef, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import aiImg from "../assets/ai.gif"
import { CgMenuRight } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";
import userImg from "../assets/user.gif"
import image1 from "../assets/image1.png"
import image2 from "../assets/image2.jpg"
import image4 from "../assets/image4.png"
import image5 from "../assets/image5.png"
import image6 from "../assets/image6.jpeg"
import image7 from "../assets/image7.jpeg"

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(userDataContext)
  const navigate = useNavigate()
  const [userText, setUserText] = useState("")
  const [aiText, setAiText] = useState("")
  const isSpeakingRef = useRef(false)
  const recognitionRef = useRef(null)
  const [ham, setHam] = useState(false)
  const isRecognizingRef = useRef(false)
  const synth = window.speechSynthesis

  const getAssistantImage = (imagePath) => {
    if (!imagePath) return image1
    if (imagePath.startsWith('http')) return imagePath
    const imageMap = {
      '/src/assets/image1.png': image1,
      '/src/assets/image2.jpg': image2,
      '/src/assets/image4.png': image4,
      '/src/assets/image5.png': image5,
      '/src/assets/image6.jpeg': image6,
      '/src/assets/image7.jpeg': image7
    }
    return imageMap[imagePath] || image1
  }

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true })
    } catch (error) {}
    setUserData(null)
    navigate("/signin")
  }

  const startRecognition = () => {
    if (!isSpeakingRef.current && !isRecognizingRef.current) {
      try {
        recognitionRef.current?.start()
      } catch (error) {
        if (error.name !== "InvalidStateError") console.error(error)
      }
    }
  }

  const voicesRef = useRef([])

  useEffect(() => {
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices()
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
  }, [])

  const speak = (text) => {
    if (!text || text.trim() === '') return
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.85
    utterance.volume = 1

    const voices = voicesRef.current
    const isFemale = (userData?.assistantGender || 'female') === 'female'

    // Best priority: Google Hindi/Indian voice matching gender
    const voice =
      voices.find(v => v.name === (isFemale ? 'Google हिन्दी' : 'Google हिन्दी')) ||
      voices.find(v => v.lang === 'en-IN' && v.name.toLowerCase().includes(isFemale ? 'female' : 'male')) ||
      voices.find(v => v.lang === 'en-IN') ||
      voices.find(v => v.name.includes('Google') && v.lang.startsWith('en-IN')) ||
      voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
      voices.find(v => v.lang.startsWith('en'))

    if (voice) utterance.voice = voice
    utterance.lang = voice?.lang || 'en-IN'
    utterance.pitch = isFemale ? 1.1 : 0.85

    isSpeakingRef.current = true
    utterance.onend = () => {
      isSpeakingRef.current = false
      setTimeout(() => startRecognition(), 1000)
    }
    utterance.onerror = () => {
      isSpeakingRef.current = false
    }
    synth.speak(utterance)
  }

  const handleCommand = (data) => {
    const { type, userInput, response } = data
    speak(response)
    if (type === 'google-search') {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(userInput)}`, '_blank')
    }
    if (type === 'youtube-search' || type === 'youtube-play') {
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(userInput)}`
      const newWindow = window.open(url, '_blank')
      if (!newWindow) window.location.href = url
    }
    if (type === 'calculator-open') window.open('https://www.google.com/search?q=calculator', '_blank')
    if (type === 'instagram-open') window.open('https://www.instagram.com/', '_blank')
    if (type === 'facebook-open') window.open('https://www.facebook.com/', '_blank')
    if (type === 'weather-show') window.open('https://www.google.com/search?q=weather', '_blank')
  }

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognitionRef.current = recognition

    let isMounted = true

    const startTimeout = setTimeout(() => {
      if (isMounted && !isSpeakingRef.current && !isRecognizingRef.current) {
        try { recognition.start() } catch (e) { if (e.name !== "InvalidStateError") console.error(e) }
      }
    }, 1000)

    recognition.onstart = () => { isRecognizingRef.current = true }

    recognition.onend = () => {
      isRecognizingRef.current = false
      if (isMounted && !isSpeakingRef.current) {
        setTimeout(() => {
          if (isMounted) {
            try { recognition.start() } catch (e) { if (e.name !== "InvalidStateError") console.error(e) }
          }
        }, 1000)
      }
    }

    recognition.onerror = (event) => {
      isRecognizingRef.current = false
      if (event.error !== "aborted" && isMounted && !isSpeakingRef.current) {
        setTimeout(() => {
          if (isMounted) {
            try { recognition.start() } catch (e) { if (e.name !== "InvalidStateError") console.error(e) }
          }
        }, 1000)
      }
    }

    recognition.onresult = async (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim()
      const lowerTranscript = transcript.toLowerCase()
      const lowerName = userData.assistantName.toLowerCase()

      const nameDetected = lowerTranscript.includes(lowerName)
      const isCommand = lowerTranscript.includes('youtube') ||
        lowerTranscript.includes('google') ||
        lowerTranscript.includes('search') ||
        lowerTranscript.includes('play') ||
        lowerTranscript.includes('open') ||
        lowerTranscript.includes('time') ||
        lowerTranscript.includes('date') ||
        lowerTranscript.includes('weather') ||
        lowerTranscript.includes('instagram') ||
        lowerTranscript.includes('facebook') ||
        lowerTranscript.includes('calculator') ||
        lowerTranscript.includes('what') ||
        lowerTranscript.includes('how') ||
        lowerTranscript.includes('why') ||
        lowerTranscript.includes('who') ||
        lowerTranscript.includes('where') ||
        lowerTranscript.includes('when') ||
        lowerTranscript.includes('which') ||
        lowerTranscript.includes('tell me') ||
        lowerTranscript.includes('explain') ||
        lowerTranscript.includes('define') ||
        lowerTranscript.includes('meaning of') ||
        lowerTranscript.includes('difference between') ||
        transcript.trim().split(' ').length >= 3

      if (nameDetected || isCommand) {
        setAiText("")
        setUserText(transcript)
        recognition.stop()
        isRecognizingRef.current = false

        try {
          const data = await getGeminiResponse(transcript)
          handleCommand(data)
          setAiText(data.response)
          setUserText("")
        } catch (error) {
          setAiText('Sorry, I had trouble understanding that.')
          setUserText("")
        }
      }
    }

    const greeting = new SpeechSynthesisUtterance(`Hello ${userData.name}, I am ${userData.assistantName}. How can I help you?`)
    greeting.lang = 'en-US'
    document.addEventListener('click', () => synth.speak(greeting), { once: true })

    return () => {
      isMounted = false
      clearTimeout(startTimeout)
      recognition.stop()
      isRecognizingRef.current = false
    }
  }, [])

  return (
    <div className='w-full h-screen bg-linear-to-t from-black to-blue-900 flex justify-center items-center flex-col gap-[15px] overflow-hidden'>
      <CgMenuRight className='lg:hidden text-white absolute top-5 right-5 w-[25px] h-[25px]' onClick={() => setHam(true)} />
      <div className={`absolute lg:hidden top-0 w-full h-full bg-[#00000053] backdrop-blur-lg p-5 flex flex-col gap-5 items-start ${ham ? "translate-x-0" : "translate-x-full"} transition-transform`}>
        <RxCross1 className='text-white absolute top-5 right-5 w-[25px] h-[25px]' onClick={() => setHam(false)} />
        <button className='min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full cursor-pointer text-[19px]' onClick={handleLogOut}>Log Out</button>
        <button className='min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full cursor-pointer text-[19px] px-5 py-2.5' onClick={() => navigate("/customize")}>Customize Assistant</button>
        <div className='w-full h-0.5 bg-gray-400'></div>
        <h1 className='text-white font-semibold text-[19px]'>History</h1>
        <div className='w-full h-[400px] gap-5 overflow-y-auto flex flex-col truncate'>
          {userData?.history?.map((his, index) => (
            <div key={index} className='text-gray-200 text-[18px] w-full h-[30px]'>{his}</div>
          ))}
        </div>
      </div>

      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold absolute hidden lg:block top-5 right-5 bg-white rounded-full cursor-pointer text-[19px]' onClick={handleLogOut}>Log Out</button>
      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold bg-white absolute top-[100px] right-5 rounded-full cursor-pointer text-[19px] px-5 py-2.5 hidden lg:block' onClick={() => navigate("/customize")}>Customize Assistant</button>

      <div className='w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-3xl shadow-lg'>
        <img src={getAssistantImage(userData?.assistantImage)} alt="assistant" className='h-full object-cover' />
      </div>
      <h1 className='text-white text-[18px] font-semibold'>I'm {userData?.assistantName}</h1>
      {!aiText && <img src={userImg} alt="user" className='w-[200px]' />}
      {aiText && <img src={aiImg} alt="ai" className='w-[200px]' />}
      <h1 className='text-white text-[18px] font-semibold text-wrap text-center px-5'>{userText ? userText : aiText ? aiText : null}</h1>
    </div>
  )
}

export default Home
