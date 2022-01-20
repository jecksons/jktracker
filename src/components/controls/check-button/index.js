
export default function CheckButton({
   checked, 
   onToggle,
   caption
}) {

   return <button onClick={() => onToggle() } className={`btn-check${checked ? '-checked' : ''} min-width-10`} >
      {caption}
   </button>

}