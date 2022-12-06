import './App.css';
import {BrowserRouter, Routes, Route, Router} from 'react-router-dom';
import Home from './pages/Home';
import EditorPage from './pages/EditorPage';
import {Toaster} from 'react-hot-toast';

function App() {
  
  return (
    <>
      <div>
        <Toaster position='top-center' ></Toaster>
      </div>

      <BrowserRouter>

        <Routes>

          <Route path='/' element={<Home/>} ></Route>
          <Route path='/editor/:roomId' element={<EditorPage/>} ></Route>

        </Routes>

      </BrowserRouter>
  
    </>
  );
}

export default App;
