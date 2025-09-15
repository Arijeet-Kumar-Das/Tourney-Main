import React, { useEffect } from 'react'

import '../CSS/PlayerLogin.css';

import {useState} from 'react';
import { IoChevronBack, IoLogoGoogle } from 'react-icons/io5';

import {useNavigate} from 'react-router-dom';

import { OrganizerContext } from '../../../Contexts/OrganizerContext/OrganizerContext';
import { useContext } from 'react';
import { toast } from 'react-toastify';


import { SignInButton, useUser, useClerk } from '@clerk/clerk-react';


const OrganizerLogin = () => {

  const { backend_URL, getAuthStatusOrganizer, setIsOrganizerLoggedIn,   } = useContext(OrganizerContext);

  const navigate = useNavigate();

  const { user, isSignedIn } = useUser();

  const { signOut } = useClerk();

  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password.trim()) return;

    // setIsSubmitting(true);
    
    // // Simulate API call
    // setTimeout(() => {
    //   console.log('Player login:', formData);
    //   setIsSubmitting(false);
    // }, 1500);

    try{
      setIsSubmitting(true);
      const fetchOptions = {
        method:"POST",
        credentials:"include",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify(formData)
      }

      const response = await fetch(`${backend_URL}/api/organizer/login`,fetchOptions);
      const data = await response.json();
      if(data.success){
        toast.success(data.message);
        getAuthStatusOrganizer();
        setIsOrganizerLoggedIn(true);
        navigate('/organizer/home');
      }else{
        console.log(data);
        toast.error(data.message);
        setIsOrganizerLoggedIn(false);
      }
    }catch(error){
      console.log("Error in Organizer Login",error);
      toast.error(`Error in organizer Login ${error}`);
    }finally{
      setIsSubmitting(false);
    }



  };

  const handleGoogleLogin = async () => {
    if (isSignedIn && user) {
      const email = user?.primaryEmailAddress?.emailAddress;

      try{
        setIsSubmitting(true);
        const fetchOptions = {
          method:"POST",
          credentials:"include",
          headers:{
            "Content-Type":"application/json"
          },
          body:JSON.stringify({email})
        }
  
        const response = await fetch(`${backend_URL}/api/organizer/loginWithGoogle`,fetchOptions);
        const data = await response.json();
        if(data.success){
          toast.success(data.message);
          getAuthStatusOrganizer();
          setIsOrganizerLoggedIn(true);
          navigate('/organizer/home');
        }else{
          console.log(data);
          await signOut();
          toast.error(data.message);
          setIsOrganizerLoggedIn(false);
        }
      }catch(error){
        console.log("Error in Organizer Login",error);
        toast.error(`Error in organizer Login ${error}`);
      }finally{
        setIsSubmitting(false);
      }
      
      
    }
  };




  useEffect(() => {
    handleGoogleLogin();
  }, [isSignedIn, user]);


  return (
    <div className="player-login-container">
      <div className="player-login-wrapper">
        <button className="player-back-button" onClick={()=>{navigate('/roleSelection')}}>
          <IoChevronBack className="player-back-icon" />
          Back to role selection
        </button>

        <div className="player-login-card">
          <div className="player-login-header">
            <h1 className="player-login-title">Organizer Login</h1>
          </div>

          <form onSubmit={handleSubmit} className="player-login-form">
            <div className="player-form-group">
              <label htmlFor="playerEmail" className="player-form-label">
                Email
              </label>
              <input
                type="email"
                id="playerEmail"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="player-form-input"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="player-form-group">
              <label htmlFor="playerPassword" className="player-form-label">
                Password
              </label>
              <input
                type="password"
                id="playerPassword"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="player-form-input"
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="player-form-group player-forgotpw-link-row">
              <button
                className="player-forgotpw-link"
                type="button"
                onClick={() => navigate('/forgot-password')}
              >
                Forgot password?
              </button>
            </div>

            <button 
              type="submit" 
              className="player-signin-button"
              disabled={isSubmitting || !formData.email.trim() || !formData.password.trim()}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="player-login-divider">
              <span className="player-divider-line"></span>
              <span className="player-divider-text">or</span>
              <span className="player-divider-line"></span>
            </div>
{/* 
            <SignInButton mode="popup"
              appearance={{
                elements: {
                  footer: "hidden", // hides the entire footer with "Sign up" or "Sign in" link
                },
              }}
            >
            <button 
              type="button" 
              className="player-google-login-button"
              onClick={handleGoogleLogin}
            >
              <IoLogoGoogle className="player-google-icon" />
              Continue with Google
            </button>
        </SignInButton> */}


            <SignInButton mode="popup" redirectUrl="/organizer/login">
              <button 
                type="button" 
                className="player-google-login-button"
              >
                <IoLogoGoogle className="player-google-icon" />
                Continue with Google
              </button>
            </SignInButton>
         

            <div className="player-signup-prompt">
              <span className="player-signup-text">Don't have an account? </span>
              <button 
                type="button" 
                className="player-signup-link"
                onClick={()=>{ navigate('/signup/organizer') }}
              >
                Sign up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default OrganizerLogin
