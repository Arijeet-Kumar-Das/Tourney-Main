import React, { useEffect } from 'react'

import HeroSection from '../Components/HeroSection'


import { AppContext } from '../Contexts/AppContext/AppContext'
import { useContext } from 'react'
import { toast } from 'react-toastify'


import HomeTournamentsSection from './HomeTournamentsSection'
import Footer from "@/components/Footer";


const Home = () => {

  const { updateTournamentStatus } = useContext(AppContext);



  useEffect(() => {
    updateTournamentStatus();
  }, []);


  return (
    <div className="min-h-screen" style={{backgroundColor: '#F8F2F2'}}>
      <HeroSection/>
      <HomeTournamentsSection/>
      <Footer/>
    </div>
  )
}

export default Home
