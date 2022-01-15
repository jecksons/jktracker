
export default function CheckButton({
   checked, 
   onToggle,
   caption
}) {

   return <button onClick={() => onToggle() } className={`btn-check${checked ? '-checked' : ''}`} >
      {caption}
   </button>

}