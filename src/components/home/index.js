import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '../images/logo.png';
import googleImg from '../images/google.svg';
import fbImg from '../images/fb.png';
import clockImg from '../images/clock.png';
import clockMainImg from '../images/clock-main.png';
import {Link } from 'react-scroll';

import './styles.css';
import SurfaceLoading from "../controls/surface-loading";
import AuthService from "../../services/auth-service";
import Utils from '../../services/utils';
import GoogleLogin, { useGoogleLogin, useGoogleLogout } from 'react-google-login';
import config from "../../services/config";
import { useCurrUser } from "../../hooks/utils-hooks";
import LogoutButton from "../controls/logout-button";


function LoginContent(props) {
   const [errorMessageDemo, setErrorMessageDemo] = useState('');
   const [loadingDemo, setLoadingDemo] = useState(false);
   const [errorMessageGoogle, setErrorMessageGoogle] = useState('');
   const [loadingGoogle, setLoadingGoogle] = useState(false);
   
   const navigate = useNavigate();
   const onSuccessGoogle = useCallback((res) => {
      if (res.getBasicProfile) {
         const prof = res.getBasicProfile();
         setErrorMessageGoogle('');
         setLoadingGoogle(true);
         AuthService.loginEmail(
            prof.getName(),
            prof.getEmail())
         .then(() => navigate('/tasks'))
         .catch((err) => {
            setErrorMessageGoogle(Utils.getHTTPError(err));
            setLoadingGoogle(false);
         } );            
      }
   }, []);
   
   const onErrorGoogle = useCallback((res) => {
      console.log(res);
   }, []);
   
   const  {signIn, loaded} = useGoogleLogin({onSuccess: onSuccessGoogle, onFailure: onErrorGoogle,  clientId: config.googleClientId, cookiePolicy: 'single_host_origin' });
   

   const handleDemoClick = () => {
      setLoadingDemo(true);
      setErrorMessageDemo('');
      AuthService.loginDemo()
      .then(() => {
         navigate('/tasks');
      })
      .catch((err) => {
         setLoadingDemo(false);
         setErrorMessageDemo(Utils.getHTTPError(err));
      } );      
   }

   const handleGoogleLogin= () => {
      signIn();
   }   

   return (
      <div className="jk-column-05 width-100"> 
         <section className="login-social">
            <label>Login</label>
            <button className="btn-social-go"  onClick={handleGoogleLogin} >
               {
                  loadingGoogle ? 
                     <SurfaceLoading size={16} onBackground={true}/> : 
                     <>
                        <img src={googleImg} className="social-icon" />Continue with Google
                     </>                     
               }               
               </button>
            {errorMessageGoogle !== '' &&  <p className="error-message">{errorMessageGoogle}</p> }
         </section>
         <section className="demo-parent">
            <h2>Do you want just try it?</h2>
            <div className="jk-column-05 max-width-18">
               <button className="btn-action min-width-12 " onClick={handleDemoClick}>{loadingDemo ? <SurfaceLoading size={16} onBackground={true}/> : 'Yes, show me a demo!'} </button>
               {errorMessageDemo !== '' &&  <p className="error-message-primary">{errorMessageDemo}</p> }
            </div>
         </section>
      </div>      
   )
}

function InfoDev() {
   return (
      <section className='info-dev' >
         <p>Developed by <a href="https://jeckson.me" className="link-white">Jeckson Schwengber</a></p>
         <img src={logo} className="small-logo" />
      </section>           
   );
}

function LogoTitle({onSetShowLogin, showingLogin}) {
   const currUser = useCurrUser();

   return (
      <div className='parent-logo'>
         <div className="jk-row-top ">
            <img src={logo} className="main-logo"/>
            <h1 className="logo-title">JKTRACKER</h1>
         </div>
         {
            currUser ? 
               <div className="actions-title-home">
                  <a className="link-action" id="my-tasks-home"  href="/tasks" >My Tasks</a>
                  <LogoutButton />
               </div> :
               <button className="btn-action" id="gets-started" onClick={() => onSetShowLogin(p => !p)} >{showingLogin ? 'Hide login' : `Get's started`}  </button>
         }
         
      </div>            
   );
}

export default function Home(props) {

   const [showLogin, setShowLogin] = useState(false);
   const location = useLocation();
   const refLogin = useRef(null);
   const currUser = useCurrUser();

   useEffect(() => {
      if (location) {
         if (location.hash === '#login-action')  {
            setShowLogin(true);
            setTimeout(() => {
               refLogin.current.scrollIntoView();
            }, 100);            
         }
      }     
   }, []);


   return (
      <div className="parent-home">
         <div className="home-main-content">
            <LogoTitle onSetShowLogin={setShowLogin} showingLogin={showLogin} />
            <section className="main-info" >
               <article className="info-about">
                  <h2>JkTracker helps you to manage your time.</h2>
                  <p>You can easily manage your efforts and 
                     worked time efficiently, improving budget estimates and detecting weaknesses from estimated time to real time.</p>
               </article>
               <img src={clockMainImg} className="img-clock-main" />
            </section>         
            <article className="info-quote">
               <strong>"What gets measured gets managed"</strong>
               <h4>Peter Drucker</h4>
            </article>
            {!currUser && 
               <Link to={'login-action'} smooth={true} spy={true} duration={500} className="link-action" id='gets-started-mob' >
                  Get's started
               </Link>            
            }            
            <section className={`login-parent${showLogin ? '-show' : ''}`}>
               <LoginContent />
            </section>
            <InfoDev />
            <img className="clock-img"  src={clockImg} />    
         </div>
         {!currUser && 
            <section ref={refLogin} className="login-mobile" id="login-action">
               <div className="login-mobile-content">
                  <LogoTitle  />
                  <LoginContent />
                  <InfoDev  />
               </div>           
            </section>
         }
      </div>
      
   );
}