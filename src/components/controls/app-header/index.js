import './styles.css';
import logo from '../../images/logo.png';

export default function AppHeader(props) {

   return <header className='app-header'>
      <nav className="menu-start">
         <a href="/">Tasks</a>
         <a href="/tracking">Time tracking</a>
      </nav>
      <img className="logo" src={logo} alt="logo" />
   </header>;

}