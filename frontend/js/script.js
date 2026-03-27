const login = document.querySelector(".login")
const loginForm = login.querySelector(".login__form")
const loginInput = login.querySelector(".login__input")

const chat = document.querySelector(".chat")
const chatForm = chat.querySelector(".chat__form")
const chatInput = chat.querySelector(".chat__input")
const chatMessages = chat.querySelector(".chat__messages")
const fileInput = document.getElementById("file-input")
const documentInput = document.getElementById("document-input")

const colors = [
    "cadetblue",
    "darkgoldenrod",
    "cornflowerblue",
    "darkkhaki",
    "hotpink",
    "gold"
]

const user = { id: "", name: "", color: "" }

let websocket

const createMessageSelfElement = (content, type, filename) => {
    const div = document.createElement("div")
    div.classList.add("message--self")
    
    if (type === "image") {
        const img = document.createElement("img")
        img.src = content
        div.appendChild(img)
    } else if (type === "document") {
        const link = document.createElement("a")
        link.href = content
        link.download = filename
        link.innerHTML = `<span class="material-symbols-outlined">description</span> ${filename}`
        link.classList.add("document-message")
        div.appendChild(link)
    } else {
        div.innerHTML = content
    }

    return div
}

const createMessageOtherElement = (content, sender, senderColor, type, filename) => {
    const div = document.createElement("div")
    const span = document.createElement("span")

    div.classList.add("message--other")
    span.classList.add("message--sender")
    span.style.color = senderColor
    div.appendChild(span)
    span.innerHTML = sender
    
    if (type === "image") {
        const img = document.createElement("img")
        img.src = content
        div.appendChild(img)
    } else if (type === "document") {
        const link = document.createElement("a")
        link.href = content
        link.download = filename
        link.innerHTML = `<span class="material-symbols-outlined">description</span> ${filename}`
        link.classList.add("document-message")
        div.appendChild(link)
    } else {
        div.innerHTML += content
    }

    return div
}

const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * colors.length)
    return colors[randomIndex]
}

const scrollScreen = () => {
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    })
}

const processMessage = ({ data }) => {
    const { userId, userName, userColor, content, type, filename } = JSON.parse(data)

    const message =
        userId == user.id
            ? createMessageSelfElement(content, type, filename)
            : createMessageOtherElement(content, userName, userColor, type, filename)

    chatMessages.appendChild(message)
    scrollScreen()
}

const handleLogin = (event) => {
    event.preventDefault()
    user.id = crypto.randomUUID()
    user.name = loginInput.value
    user.color = getRandomColor()

    login.style.display = "none"
    chat.style.display = "flex"

    websocket = new WebSocket("https://chat-backend-6fb9.onrender.com")
    websocket.onmessage = processMessage
}

const sendMessage = (event) => {
    event.preventDefault()
    if (chatInput.value.trim() !== "") {
        const message = {
            userId: user.id,
            userName: user.name,
            userColor: user.color,
            content: chatInput.value,
            type: "text"
        }
        websocket.send(JSON.stringify(message))
        chatInput.value = ""
    }
}

fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
        const message = {
            userId: user.id,
            userName: user.name,
            userColor: user.color,
            content: reader.result, 
            type: "image",
            filename: file.name
        }
        websocket.send(JSON.stringify(message))
    }
    reader.readAsDataURL(file)
    fileInput.value = ""
})

documentInput.addEventListener("change", (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
        const isImage = file.type.startsWith('image/')
        
        const message = {
            userId: user.id,
            userName: user.name,
            userColor: user.color,
            content: reader.result,
            type: isImage ? "image" : "document",
            filename: file.name
        }
        websocket.send(JSON.stringify(message))
    }
    reader.readAsDataURL(file)
    documentInput.value = ""
})

loginForm.addEventListener("submit", handleLogin)
chatForm.addEventListener("submit", sendMessage)
