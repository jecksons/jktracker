import './styles.css';
import logo from '../../images/logo.png';

export default function AppHeader({selOption}) {

   return <header className='app-header'>
      <nav className="menu-start">
         <a href="/" className={selOption === 'tasks' ? 'nav-option-sel' : 'nav-option'} >Tasks</a>
         <a href="/tracking" className={selOption === 'tracking' ? 'nav-option-sel' : 'nav-option'}  >Time tracking</a>
      </nav>
      <img className="logo" src={logo} alt="logo" />
   </header>;

}