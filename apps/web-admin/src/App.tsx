import { useState } from 'react'
import { useEffect } from 'react'
import { supabase } from '@home-sweet-home/shared'
import './App.css'

function App() {
  const [status, setStatus] = useState<string>('Testing supabase')

  useEffect(() => {
    async function testSupabase(){
      try{
        const { data, error } = await supabase.auth.getSession();

        if(error){
          setStatus(`error: ${error.message}`);
        }else{
          const{error: dbError} = await supabase.from('users').select('*').limit(1);
          if(dbError && dbError.code !== '42P01'){
            console.log('DB test:', dbError);
          }

          setStatus(`Connected, Session: ${data.session ? 'Logged in' : 'Not logged in'}`);
        }
      } catch (err:any){
        setStatus(`connection error : ${err.message}`);
      }
    }

    testSupabase();
  }, []);

  return(
    <div>
      <h1>Home Sweet Home</h1>
      <h2>Supabase connection test</h2>
      <p>{status}</p>
    </div>
  );
}

export default App
