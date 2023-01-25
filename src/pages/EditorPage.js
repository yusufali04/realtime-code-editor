import React, {useEffect, useState, useRef} from 'react';
import toast from 'react-hot-toast';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import Client from '../components/Client';
import Editor from '../components/Editor'
import { initSocket } from '../socket';
import ACTIONS from '../Actions';


const EditorPage = ()=>{

    const [clients, setClients] = useState([]);

    // Initialization

    const socketRef = useRef(null);
    const location = useLocation();
    const reactNavigator = useNavigate();
    const {roomId} = useParams();
    const codeRef = useRef(null);

    ////////

    useEffect(()=>{

        
    

        const init = async ()=>{

            socketRef.current = await initSocket();
            // handling socket errors
            socketRef.current.on('connect_error', (err)=> handleErrors(err));
            socketRef.current.on('connect_failed', (err)=> handleErrors(err));
            function handleErrors(e){

                toast.error('Connection failed, try again');
                reactNavigator('/');
                
            }

            // sending socket information to backend

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state.username
            })

            //listening for joined event

            socketRef.current.on(ACTIONS.JOINED, ({clients, username, socketId})=>{

                if(username !== location.state.username){

                    toast.success(`${username} joined the room`);
                }

                setClients(clients);

                socketRef.current.emit(ACTIONS.SYNC_CODE, {

                    code: codeRef.current,
                    socketId
                    
                })

            })

            // listening for disconnected

            socketRef.current.on(ACTIONS.DISCONNECTED, ({socketId, username}) => {

                toast.success(`${username} left the room`)
                setClients((prev)=>{
                    return prev.filter((client) => {return client.socketId !== socketId})
                })
            })

        }

        init();
        return () => {
            socketRef.current.disconnect();
            socketRef.current.off(ACTIONS.JOINED).disconnect()
            socketRef.current.off(ACTIONS.DISCONNECTED).disconnect()
        }
    }, [])

    
    if(!location.state){
        return <Navigate to='/' />
    }

    async function copyRoomId(){

        try{
            await navigator.clipboard.writeText(roomId);
            toast.success('Room id copied to clipboard')

        }catch(err){
            toast.error('Failed to copy')
            console.log(err);
        }

    }

    function leaveRoom(){
        reactNavigator('/')
    }

   

    return (
    
    <div className='mainWrap'>

        <div className='aside'>

            <div className='asideInner'>

                <div className='logo'>

                    <img className='logoImg' src='/code-sync.png'></img>

                </div>

                <h3>Connected</h3>

                <div className='clientsList'>

                    {   
                        clients.map((client) => {
                            return <Client key={client.socketId} username={client.username} />
                            
                        })
                    }


                </div>

            </div>

            <button className='btn copyBtn' onClick={copyRoomId}>Copy RoomId</button>
            <button className='btn leaveBtn' onClick={leaveRoom}>Leave</button>

        </div>

        <div className='editorWrap'>

            <Editor socketRef={socketRef} roomId = {roomId} onCodeChange={(code)=>{
                codeRef.current = code
            }}/>
            
        </div>

    </div>
    
    )
}

export default EditorPage;