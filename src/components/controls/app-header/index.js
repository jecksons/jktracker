import './styles.css';
import { useState, useCallback, useEffect } from 'react';
import logo from '../../images/logo.png';
import LogoutButton from '../logout-button';
import {RiMenu5Fill} from 'react-icons/ri';
import {IoIosClose} from 'react-icons/io';
import { useCurrUser } from '../../../hooks/utils-hooks';
import {BiHome, BiBarChartSquare} from 'react-icons/bi';
import {BsListCheck} from 'react-icons/bs';
import AuthService from '../../../services/auth-service';




function LeftSideMenu({selOption, show, onRequestClose}) {

   const currUser = useCurrUser();

   const handleClickLogout = useCallback(() => {
      AuthService.logout();
   }, []);


   return <div >
      <section className={`left-side-hamb${show ? '-show' : ''}`}>
         <button className='btn-close-dialog' onClick={() => onRequestClose()}>
            <IoIosClose size={20}/>
         </button>
         <nav className='menu-start-hamb'>
            <a href='/' className='nav-option-hamb' ><BiHome size={16}/> Home</a>
            <a href="/tasks" className={selOption === 'tasks' ? 'nav-option-hamb-sel' : 'nav-option-hamb'}><BsListCheck size={16}/> Tasks</a>
            <a href="/tracking" className={selOption === 'tracking' ? 'nav-option-hamb-sel' : 'nav-option-hamb'}  ><BiBarChartSquare size={16}/>Time tracking</a>
         </nav>         
         <div className='jk-column-1' onClick={handleClickLogout}>
            <label>Hi, {currUser?.firstName}!</label>
            <button className='btn-action min-width-12'>Sair</button>
         </div>
      </section>
      <div className={`left-side-hamb-overlay${show ? '-show' : ''}`} onClick={() => onRequestClose()} > </div>
   </div>   
   
}

export default function AppHeader({selOption}) {

   const [showMenu, setShowMenu] = useState(false);

   useEffect(() => {
      const body = document.querySelector('body');
      body.style.overflow = showMenu ? 'hidden' : 'auto';
   }, [showMenu]);

   return <header className='app-header'>
      <section className='header-norm'>
         <nav className="menu-start">
            <a href='/'><img className="logo" src={logo} alt="logo"  /></a>
            <a href="/tasks" className={selOption === 'tasks' ? 'nav-option-sel' : 'nav-option'} >Tasks</a>
            <a href="/tracking" className={selOption === 'tracking' ? 'nav-option-sel' : 'nav-option'}  >Time tracking</a>
         </nav>
         <div>
            <LogoutButton />      
         </div>
      </section>
      <section className='header-mob'>
         <button className='btn-icon-menu' onClick={() => setShowMenu(p => !p)} > <RiMenu5Fill size={20}/> </button>
         <a href='/'><img className="logo" src={logo} alt="logo"  /></a>
      </section>
      <LeftSideMenu  selOption={selOption} show={showMenu} onRequestClose={() => setShowMenu(false)}  />      
   </header>;

}