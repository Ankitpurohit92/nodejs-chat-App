const socket=io();

//Elements
const chatForm=document.querySelector('form');
const messageText=document.querySelector('input');
const messageButton=document.querySelector('#send-message')
const locationButton=document.querySelector('#send-location')
const messageDiv=document.querySelector('#message')

//Template
const messageTemplate=document.querySelector('#message-template').innerHTML
const locationTemplate=document.querySelector('#location-template').innerHTML
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML

//Options
const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoscroll=()=>{
    const $newMessage= messageDiv.lastElementChild

    const newMessageStyles=getComputedStyle($newMessage)
    const newMessageMargin=parseInt(newMessageStyles.marginBottom)
    const newMessageHight= $newMessage.offsetHeight + newMessageMargin

    const visibleHeight=messageDiv.offsetHeight

    const containerHeight=messageDiv.scrollHeight

    const scrollOffset=messageDiv.scrollTop + visibleHeight

    if(containerHeight-newMessageHight<=scrollOffset){
        messageDiv.scrollTop=messageDiv.scrollHeight
    }

}

socket.on("message",(message)=>{
    const html=Mustache.render(messageTemplate,
        {
        message:message.text,
        name:message.name,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    messageDiv.insertAdjacentHTML('beforeend',html)
    autoscroll()

})

socket.on("locationMessage",(url)=>{
    const html=Mustache.render(locationTemplate,{
        url:url.text,
        name:url.name,
        createdAt:moment(url.createdAt).format('h:mm a')
    })
    messageDiv.insertAdjacentHTML('beforeend',html)
    autoscroll()

})

socket.on("roomData",({room,users})=>{
    const html=Mustache.render(sidebarTemplate,{room,users})
    document.querySelector('#sidebar').innerHTML= html
})

chatForm.addEventListener("submit",(e)=>{
    e.preventDefault();
    messageButton.setAttribute('disabled','disable')
    socket.emit('message',e.target.elements.message.value,(error)=>{
        messageButton.removeAttribute('disabled')
        messageText.value='';
        messageText.focus()
        if(error){
            return console.log(error);
        }
        console.log("message was delivered");
    })
})

document.querySelector('#send-location').addEventListener('click',(e)=>{
    e.preventDefault();
    if(!navigator.geolocation){
        return alert('geolocation is not supported by your browser')
    }
    locationButton.setAttribute('disabled','disabled');
    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('send-location',{latitude:position.coords.latitude,
            longitude:position.coords.longitude},()=>{
                locationButton.removeAttribute('disabled')
                console.log("location shared")
            })

    })
})
socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})

