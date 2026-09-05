if (typeof String.prototype.replaceAll === "undefined") {
    String.prototype.replaceAll = function (match, replace) {
        match = match.replace(/[-[\]{}()*+?.\\\/^$|]/g, "\\$&");
        return this.replace(new RegExp(match, "g"), replace);
    }
}

// I am a child from Israel and this is my code
let trusted = false;
let admin = false;
let king = false;
let autorejoin = true;
let blockerror = false;

const { entries, values } = Object;
const { isArray } = Array;
const { seedrandom, random, floor } = Math;

function clamp(min, x, max) {
    return Math.min(Math.max(x, min), max);
}

function s4() {
    return floor((1 + random()) * 0x10000).toString(16).substring(1);
}

function youtubeParser(url) {
    let regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    let match = url.match(regExp);
    return match?.[7].length == 11 ? match[7] : false;
}

function sanitize(text) {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&apos;");
}

window.onclick = (e) => {
    let spoiler = e.target.closest("GAY-SPOILER");
    if (spoiler) spoiler.classList.add("reveal");
};

let rules = {
    "**": "b",
    "~~": "i",
    "--": "s",
    "__": "u",
    "``": "code",
    "^^": "gay-big", // these are fine
    "$r$": "gay-rainbow",
    "||": "gay-spoiler",
}

function markup(text) {
    text = sanitize(text);
    text = text
        .replace(/(^|\\n)(&gt;.*?)($|\\n)/g, "$1<span class=\"greentext\">$2</span>$3")
        .replaceAll("\\n", "<br>");
    for (let [token, tag] of entries(rules)) {
        let closing = false;
        while (text.includes(token)) {
            text = text.replace(token, closing ? `</${tag}>` : `<${tag}>`);
            closing = !closing;
        }
        if (closing) {
            text += `</${tag}>`;
        }
    }
    text = text
        .replaceAll("{FRANCE}", "<img src=\"./img/france.svg\" class=\"flag\" alt=\"\u{1F1EB}\u{1F1F7}\">")
        .replace(/(https?:\/\/[^\s<>"']+)/g, "<a target=\"_blank\" href=\"$1\">$1</a>");
    return text;
}

function nmarkup(text) {
    while (text.includes("^^") || text.includes("||") || text.includes("\\n")) {
        text = text.replaceAll("^^", "").replaceAll("||", "").replaceAll("\\n", "");
    }
    return markup(text);
}

function createPoll(poll) {
    let element = document.createElement("div");
    element.classList.add("poll");
    element.classList.add(`poll_${poll.id}`);
    element.innerHTML = `
        ${markup(poll.title)}<br>
        <div class="yes">Yes: <span class="yes_number">0</span></div>
        <div class="no">No: <span class="no_number">0</span></div>
    `;
    element.poll = poll;
    element.querySelector(".yes").onclick = () => {
        socket.emit("vote", {
            poll: poll.id,
            vote: true
        });
    };
    element.querySelector(".no").onclick = () => {
        socket.emit("vote", {
            poll: poll.id,
            vote: false
        });
    };
    return element;
}

function updatePoll(id, voterId, vote) {
    let elements = document.querySelectorAll(`.poll_${id}`);
    if (elements.length === 0) return;
    let poll = elements[0].poll;
    poll.votes[voterId] = vote;
    let yesVotes = values(poll.votes).filter(x => x).length;
    let allVotes = values(poll.votes).length;
    let noVotes = allVotes - yesVotes;
    let yesPercentage = yesVotes / allVotes * 100;
    let noPercentage = noVotes / allVotes * 100;
    for (let element of elements) {
        element.querySelector(".yes_number").innerText = yesVotes;
        element.querySelector(".no_number").innerText = noVotes;
        element.querySelector(".yes").style.backgroundImage = `linear-gradient(to right, lime ${yesPercentage}%, #cfc ${yesPercentage}%)`;
        element.querySelector(".no").style.backgroundImage = `linear-gradient(to right, red ${noPercentage}%, #fcc ${noPercentage}%)`;
    }
}

let lastZ = 1;
let dragged = null;
let dragX = 0;
let dragY = 0;
let chatLogDragged = false;

let colors = ["purple", "blue", "green", "yellow", "red", "pink", "brown", "black", "cyan", "black", "pope", "blessed", "white", "chartreuse",  "jew"];
let hats = ["tophat", "bfdi", "bieber", "evil", "elon", "kamala", "maga", "troll", "bucket", "obama", "dank", "witch", "wizard"]

let quote = null;
let lastUser = "";

function time() {
    let date = new Date();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let hourString = String(hours % 12).padStart(2, "0");
    let minuteString = String(minutes).padStart(2, "0");
    let ampm = hours >= 12 ? "PM" : "AM";
    return `${hourString}:${minuteString} ${ampm}`;
}

function bonzilog(id, name, html, color, text, single) {
    // hacky
    // remind me to rewrite this as this is the biggest peice of dogshit
    let icon = "";
    let scrolled = chat_log_content.scrollHeight - chat_log_content.clientHeight - chat_log_content.scrollTop <= 20;
    if (color) {
        let [baseColor, ...hats] = color.split(" ");
        icon = `<div class="log_icon">
            <img class="color" src="img/pfp/${baseColor}.webp">
            ${hats.map(hat => `<img class="hat" src="img/pfp/${hat}.webp">`).join(" ")
            }
        </div>`;
    } else {
        icon = `<div class="log_left_spacing"></div>`;
    }
    let thisUser = `${id};${name};${color}`;
    if (thisUser !== lastUser || single) {
        let timeString = `<span class="log_time">${time()}</span>`;
        chat_log_content.insertAdjacentHTML("beforeend", `
            <hr>
            <div class="log_message">
                ${icon}
                <div class="log_message_cont">
                    <div class="reply"></div>
                    <span><b>${nmarkup(name)}</b> ${name ? timeString : ""}</span>
                    <div class="log_message_content">${html} ${name ? "" : timeString}</div> 
                </div>
            </div>`);
        lastUser = single ? "" : thisUser;
    } else {
        chat_log_content.insertAdjacentHTML("beforeend", `
            <div class="log_message log_continue">
                <div class="reply"></div>
                <div class="log_left_spacing"></div>
                <div class="log_message_cont">
                    <div class="log_message_content">${html}</div>
                </div>
            </div>`);
    }
    chat_log_content.lastChild.querySelector(".reply").onclick = () => {
        quote = { name, text: text };
        talkcard.innerHTML = `Replying to ${nmarkup(name)}`;
        chat_message.focus();
        talkcard.hidden = false;
    };
    if (scrolled) {
        chat_log_content.scrollTop = chat_log_content.scrollHeight;
    }
}

function toBgImg(name, color) {
    return color.split(" ").map(sprite => `url("img/bonzi/${sprite}.webp")`).reverse().join(", ");
}

let logJoins = false;

class Bonzi {
    constructor(id, userPublic) {
        this.userPublic = userPublic || {
            name: "BonziBUDDY",
            color: "purple",
            speed: 175,
            pitch: 50,
            voice: "en-us",
        };
        this.color = this.userPublic.color;
        this.data = window.BonziData;

        this.eventList = [];
        this.eventFrame = 0;
        this.currentAnim = "idle";
        this.animFrame = 0;
        this.sprite = 0;

        this.mute = false;
        this.id = id || s4() + s4();

        this.rng = new seedrandom(this.id || random());

        this.element = document.createElement("div");
        this.element.classList.add("bonzi");
        this.element.style.backgroundImage = this.toBgImg();
        this.element.style.zIndex = lastZ++;
        this.nametag = document.createElement("div");
        this.nametag.classList.add("bonzi_name");
        this.element.appendChild(this.nametag);
        this.tag = document.createElement("div");
        this.tag.classList.add("bonzi_tag");
        this.element.appendChild(this.tag);
        this.bubble = document.createElement("div");
        this.bubble.classList.add("bubble");
        this.bubble.hidden = true;
        this.bubbleCont = document.createElement("div");
        this.bubbleCont.classList.add("bubble_cont");
        this.bubble.appendChild(this.bubbleCont);
        this.element.appendChild(this.bubble);
        content.appendChild(this.element);

        this.updateName();
        this.updateSprite();
        this.updateTag();

        this.element.onpointerdown = (e) => {
            if (this.bubble.contains(e.target)) return;
            if (e.which === 1) {
                if (!gravity) dragged = this;
                dragX = e.pageX - this.x;
                dragY = e.pageY - this.y;
                this.lastX = this.x;
                this.lastY = this.y;
                this.element.style.zIndex = lastZ++;
            }
            if (e.which === 2) {
                this.cancel();
                this.mute = !this.mute;
                this.updateName();
            }
        };
        this.element.addEventListener("contextmenu", (e) => {
            if (this.bubble.contains(e.target)) e.stopPropagation();
        });
        this.element.onclick = (e) => {
            if (this.bubble.contains(e.target)) return;
            if (this.x === this.lastX && this.y === this.lastY) {
                this.cancel();
            }

        };

        var coords = this.maxCoords();
        this.x = coords.x * this.rng();
        this.y = coords.y * this.rng();
        this.move();
        this.element.id = s4() + s4();

        $.contextMenu({
            selector: `#${this.element.id}`,
            build: () => {
                let extra = {};
                if (trusted || king || admin) {
                    // coded like a true React programmer
                    extra = {
                        "bless": {
                            name: "Bless",
                            callback: () => {
                                socket.emit("command", {
                                    list: ["bless", this.id],
                                });
                            },
                        },
                        "nameedit": {
                            name: "Change Name",
                            callback: () => {
                                socket.emit("command", {
                                    list: ["nameedit", this.id, prompt("give this guy a name")],
                                });
                            },
                        },
                        "tagedit": {
                            name: "Change Tag",
                            callback: () => {
                                socket.emit("command", {
                                    list: ["tagedit", this.id, prompt("give this guy a tag")],
                                });
                            },
                        },
                        ...(king || admin ? {
                            "kick": {
                                name: "Kick",
                                callback: () => {
                                    socket.emit("command", {
                                        list: ["kick", this.id],
                                    });
                                },
                            },
                            "teFbwmpban": {
                                name: "Temp Ban",
                                callback: () => {
                                    socket.emit("command", {
                                        list: ["tempban", this.id],
                                    });
                                }
                            },
                            "nuke": {
                                name: "NUKE",
                                callback: () => {
                                    socket.emit("command", {
                                        list: ["nuke", this.id],
                                    });
                                }
                            },
                            ...(admin ? {
                                "ban": {
                                    name: "Ban",
                                    callback: () => {
                                        socket.emit("command", {
                                            list: ["ban", this.id],
                                        });
                                    },
                                },
                                "info": {
                                    name: "Info",
                                    callback: () => {
                                        socket.emit("command", {
                                            list: ["info", this.id],
                                        });
                                    },
                                }
                            } : {})
                        } : {})
                    };
                };
                return {
                    items: {
                        "cancel": {
                            name: "Cancel",
                            callback: () => { this.cancel(); }
                        },
                        "mute": {
                            name: () => this.mute ? "Unmute" : "Mute",
                            callback: () => {
                                this.cancel();
                                this.mute = !this.mute;
                                this.updateName();
                            }
                        },
                        "asshole": {
                            name: "Call an Asshole",
                            callback: () => {
                                socket.emit("command", {
                                    list: ["asshole", this.userPublic.name]
                                });
                            }
                        },
                        "bass": {
                            name: "Call a Bass",
                            callback: () => {
                                socket.emit("command", {
                                    list: ["bass", this.userPublic.name]
                                });
                            }
                        },
                        "owo": {
                            name: "Notice Bulge",
                            callback: () => {
                                socket.emit("command", {
                                    list: ["owo", this.userPublic.name]
                                });
                            }
                        },
                        ...extra,
                    }
                };
            },
            animation: {
                duration: 175,
                show: 'fadeIn',
                hide: 'fadeOut'
            }
        });
        this.eventList = [{
            type: "anim",
            anim: "surf_intro",
            ticks: 30
        }, { type: "idle" }];
        if (gravity) {
            this.element.classList.add("box2d");
            addElement(this.element);
        }
    }

    toBgImg() {
        return toBgImg(this.userPublic.name, this.color);
    }

    move(x, y) {
        if (arguments.length !== 0) {
            this.x = x;
            this.y = y;
        }
        let max = this.maxCoords();
        let chatLog = chat_log.getBoundingClientRect();
        this.x = clamp(chatLog.width, this.x, max.x);
        this.y = clamp(0, this.y, max.y);
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        this.updateDialog();
    }

    runEvent(list) {
        if (this.mute) return;
        this.cancel();
        this.eventList = [{ type: "idle" }, ...list, { type: "idle" }];
    }

    clearDialog() {
        this.bubbleCont.textContent = "";
        this.bubble.hidden = true;
    }

    cancel() {
        this.clearDialog();
        this.stopSpeaking();
        this.eventList = [{ type: "idle" }];
        this.eventFrame = 0;
    }

    stopSpeaking() {
        if (this.voiceSource) {
            this.voiceSource.stop();
            // This is most fragile part of the code and all bugs will happen here
            if (this.voiceSource.onended) this.voiceSource.onended();
            this.voiceSource.onended = () => { };
            if (this.voiceSource.endTimeout) {
                this.clearDialog();
                clearTimeout(this.voiceSource.endTimeout);
            }
        }
    }

    setSprite(sprite) {
        this.sprite = sprite;
        this.element.style.backgroundPositionX = `-${sprite % 12 * 200}px`;
        this.element.style.backgroundPositionY = `-${floor(sprite / 12) * 160}px`;
    }

    setAnim(anim) {
        this.currentAnim = anim;
        this.animFrame = 0;
    }

    update() {
        let anim = this.data.sprite.animations[this.currentAnim];
        let frame = anim[this.animFrame];
        while (typeof frame === "string") {
            this.setAnim(frame);
            anim = this.data.sprite.animations[this.currentAnim];
            frame = anim[this.animFrame];
        }
        if (frame != null) this.setSprite(frame);
        this.animFrame++;
        if (this.eventList.length === 0) {
            return;
        }
        let nextEvent = () => {
            this.eventList.shift();
            this.eventFrame = 0;
        };
        let event = this.eventList[0];
        let eventType = event.type;
        switch (eventType) {
            case "anim":
                if (this.eventFrame === 0) {
                    this.setAnim(event.anim);
                }
                this.eventFrame++;
                if (this.eventFrame >= event.ticks) {
                    nextEvent();
                }
                break;
            case "text":
                if (this.eventFrame === 0) {
                    this.talk(event.text, event.say, {
                        quote: event.quote,
                        french: event.french
                    });
                    this.eventFrame = 1;
                };
                if (this.bubble.hidden) nextEvent();
                break;
            case "idle":
                if (this.eventFrame === 0) {
                    this.eventFrame = 1;
                    let toIdle = this.data.to_idle[this.currentAnim];
                    if (toIdle) {
                        this.setAnim(toIdle);
                    } else {
                        this.setAnim("idle");
                    }
                }
                if (this.sprite === 0) {
                    nextEvent();
                }
                break;
            case "add_random":
                let pool = event.pool;
                let index = floor(pool.length * this.rng());
                let events = pool[index];
                nextEvent();
                for (let e of events.toReversed()) {
                    this.eventList.unshift(e);
                }
                break;
        }
    }

    talk(text, say, { quote, french } = {}) {
        if (say == null) say = text;
        this.stopSpeaking();
        this.bubble.hidden = false;
        text = text
            .replaceAll("{NAME}", this.userPublic.name.replaceAll("$", "$$"))
            .replaceAll("{COLOR}", this.color);
        if (say != null) {
            say = say
                .replaceAll("{NAME}", this.userPublic.name)
                .replaceAll("{COLOR}", this.color)
                .replace(/\|\|.+?(\|\||$)/g, french ? "divulgacher" : "spoiler")
                .replace(/\^\^|\$r\$|\*\*|--|~~|__|\[\[|\\n/g, "");
        }

        if (french) {
            text = "{FRANCE} " + text;
            say = "[[_^_fr]] " + say;
        }

        // text = linkify(text);
        let quoteHTML = "";
        if (quote) {
            quoteHTML = `
                <blockquote>
                    ${markup(quote.text)}
                </blockquote>
                <font color="blue">@${nmarkup(quote.name)}</font>
            `;
            if (!say.startsWith("-")) say = `at ${quote.name}, ${say}`;
        }
        let html = `${quoteHTML}${text === "{TOPJEJ}" ? "<img src='./img/misc/topjej.png'>" : markup(text)}`;
        for (let word of wordBlacklist) {
            word = word.trim().toLowerCase();
            if (word.length === 0) continue;
            if (text.toLowerCase().includes(word)) {
                html = `This message was blacklisted. <button data-html="${sanitize(html)}" onclick="this.parentElement.innerHTML = this.getAttribute('data-html')">Show</button>`;
                say = "-";
                break;
            }
        }
        this.bubbleCont.innerHTML = html;

        // here marks the point where i fucking give up
        bonzilog(this.id, this.userPublic.name, html, this.color, text, quoteHTML !== "");

        if (!say.startsWith("-")) {
            speak.play(say, {
                "pitch": this.userPublic.pitch,
                "speed": this.userPublic.speed
            }, () => {
                if (!text.includes("||")) this.clearDialog();
            }, (source) => {
                this.voiceSource = source;
            });
        }
    }

    joke() { this.runEvent(this.data.event_list_joke); }

    fact() { this.runEvent(this.data.event_list_fact); }

    poll(id, text) {
        let poll = {
            id: id,
            title: text,
            votes: [],
        };
        let element = createPoll(poll);
        this.cancel();
        if (!this.mute) {
            this.bubbleCont.textContent = "";
            this.bubbleCont.appendChild(element);
            this.bubble.hidden = false;
            let element2 = createPoll(poll);
            let scrolled = chat_log_content.scrollHeight - chat_log_content.clientHeight - chat_log_content.scrollTop <= 1;
            bonzilog(this.id, this.userPublic.name, "", this.color, `(POLL) ${text}`, true);
            chat_log_content.lastChild.querySelector(".log_message_content").appendChild(element2);
            if (scrolled) {
                chat_log_content.scrollTop = chat_log_content.scrollHeight;
            }
            speak.play(text.replaceAll("[[", ""), {
                "pitch": this.userPublic.pitch,
                "speed": this.userPublic.speed
            }, () => { }, (source) => {
                this.voiceSource = source;
            });
        }
    }

    image(url) {
        this.cancel();
        if (!this.mute) {
            let image = new Image();
            image.src = url;
            image.onload = () => {
                let html = `<img src="${sanitize(url)}" class="userimage">`;
                if (localStorage.hideImages === "true") {
                    html = `This image is hidden. <button data-html="${sanitize(html)}" onclick="this.parentElement.innerHTML = this.getAttribute('data-html')">Show</button>`;
                }
                this.bubbleCont.innerHTML = html;
                this.bubble.hidden = false;
                bonzilog(this.id, this.userPublic.name, html, this.color, `(IMAGE)`, false);
            };
        }
    }

    video(url) {
        if (this.mute) return;
        let html = `<video class="uservideo" controls><source src="${sanitize(url)}"></video>`;
        if (localStorage.hideImages === "true") {
            html = `This image is hidden. <button data-html="${sanitize(html)}" onclick="this.parentElement.innerHTML = this.getAttribute('data-html')">Show</button>`;
        }
        this.bubbleCont.innerHTML = html;
        this.bubble.hidden = false;
        bonzilog(this.id, this.userPublic.name, html, this.color, `(VIDEO)`, false);

    }

    exit() {
        this.runEvent([{
            type: "anim",
            anim: "surf_away",
            ticks: 30
        }]);
        usersPublic.delete(this.id);
        setTimeout(() => {
            this.deconstruct();
            bonzis.delete(this.id);
        }, 2000);
    }

    deconstruct() {
        this.stopSpeaking();
        if (dragged === this) {
            dragged = null;
        }
        this.element.remove();
    }

    updateName() {
        let typing = "";

        if (this.mute) {
            typing = " (muted)";
        } else if (this.userPublic.typing) {
            typing = ` (${this.userPublic.typing})`;
        };
        this.nametag.innerHTML = nmarkup(this.userPublic.name) + "" + typing;
    }

    updateTag() {
        this.tag.innerHTML = nmarkup(this.userPublic.tag);
    }

    youtube(vid) {
        if (!this.mute) {
            this.bubbleCont.innerHTML = `
                    <iframe type="text/html" width="173" height="173" 
					src="https://www.youtube.com/embed/${vid.replaceAll("\"", "'")}" 
					style="width:173px;height:173px"
					frameborder="0"
					allowfullscreen="allowfullscreen"
					mozallowfullscreen="mozallowfullscreen"
					msallowfullscreen="msallowfullscreen"
					oallowfullscreen="oallowfullscreen"
					webkitallowfullscreen="webkitallowfullscreen"
					></iframe>
			`;
            this.bubble.hidden = false;
        }
    }

    backflip(swag) {
        var event = [{
            type: "anim",
            anim: "backflip",
            ticks: 15
        }];
        if (swag) {
            event.push({
                type: "anim",
                anim: "cool_fwd",
                ticks: 30
            });
            event.push({
                type: "idle"
            });
        }
        this.runEvent(event);
    }

    updateDialog() {
        let max = this.maxCoords();
        this.bubble.classList.remove("bubble-top");
        this.bubble.classList.remove("bubble-left");
        this.bubble.classList.remove("bubble-right");
        this.bubble.classList.remove("bubble-bottom");
        let bubbleRect = this.bubble.getBoundingClientRect();
        if (this.data.size.x + bubbleRect.width > max.x) {
            if (this.y < innerHeight / 2 - this.data.size.x / 2) {
                this.bubble.classList.add("bubble-bottom");
            } else {
                this.bubble.classList.add("bubble-top");
            }
        } else {
            if (this.x < innerWidth / 2 - this.data.size.x / 2) {
                this.bubble.classList.add("bubble-right");
            } else {
                this.bubble.classList.add("bubble-left");
            }
        }
    }

    maxCoords() {
        return {
            x: innerWidth - this.data.size.x,
            y: innerHeight - this.data.size.y - chat_bar.getBoundingClientRect().height,
        };
    }

    asshole(target) {
        this.runEvent(
            [{
                type: "text",
                text: `Hey, ${target}!`
            }, {
                type: "text",
                text: "You're a fucking asshole!",
                say: "your a fucking asshole!"
            }, {
                type: "anim",
                anim: "grin_fwd",
                ticks: 15
            }]
        );
    }

    owo(target) {
        this.runEvent(
            [{
                type: "text",
                text: `*notices ${target}'s BonziBulge™*`,
                say: `notices ${target}s bonzibulge`
            }, {
                type: "text",
                text: "owo, wat dis?",
                say: "oh woah, what diss?"
            }]
        );
    }

    bass(target) {
        this.runEvent(
            [{
                type: "text",
                text: `Hey, ${target}!`,
            }, {
                type: "text",
                text: "You're a fucking bass!",
            }, {
                type: "anim",
                anim: "grin_fwd",
                ticks: 15
            },]
        );
    }

    updateSprite() {
        this.cancel();
        this.element.style.backgroundImage = this.toBgImg();
        this.move();
    }

    explode() {
        let explosion = document.createElement("div");
        explosion.className = "explosion";
        explosion.style.left = this.x + "px";
        explosion.style.top = this.y + "px";
        document.body.appendChild(explosion);
        this.element.style.zIndex = "999999"; // show above chat log
        let sfx = new Audio("./explosion.mp3");
        sfx.play();
        let rot = 0;
        let x = 0;
        let y = 0;
        let angvel = Math.random() * 30 + 20;
        if (Math.random() > 0.5) angvel *= -1;
        let xvel = Math.random() * 10 + 5;
        if (Math.random() > 0.5) xvel *= -1;
        let yvel = -20;
        let i = 0;
        let interval = setInterval(() => {
            i++;
            yvel += 2;
            x += xvel;
            rot += angvel;
            y += yvel;
            this.element.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
            if (i > 120) {
                clearInterval(interval);
                explosion.remove();
            }
        }, 33)
    }
}

window.onload = () => {
    document.getElementById("login_load").hidden = true;
    document.getElementById("login_card").hidden = false;
};

window.onresize = () => {
    for (let bonzi of bonzis.values()) {
        bonzi.move();
    }
};

chat_log_resize.onpointerdown = (e) => {
    chatLogDragged = true;
    dragX = e.pageX - chat_log_resize.getBoundingClientRect().left;
};

window.onpointermove = (e) => {
    if (dragged) {
        dragged.move(e.pageX - dragX, e.pageY - dragY);
    }
    if (chatLogDragged) {
        window.onresize();
        chat_log.style.width = `${e.pageX - dragX}px`;
    }
};

window.onpointerup = () => {
    dragged = null;
    chatLogDragged = false;
};

btn_tile.onclick = () => {
    let winWidth = window.innerWidth;
    let winHeight = window.innerHeight;
    let minY = 0;
    let addY = 80;
    let x = 0, y = 0;
    for (let bonzi of bonzis.values()) {
        bonzi.move(x, y);

        x += 200;
        if (x + 100 > winWidth) {
            x = 0;
            y += 160;
            if (y + 160 > winHeight) {
                minY += addY;
                addY /= 2;
                y = minY;
            }
        }
    }
};

function bonzisCheck() {
    let safeBonzis = new Set;
    for (let [key, public] of usersPublic.entries()) {
        if (!bonzis.has(key)) {
            let bonzi = new Bonzi(key, public);
            bonzis.set(key, bonzi);
            safeBonzis.add(bonzi);
            if (logJoins) {
                let msg = `${nmarkup(public.name)} has joined.`;
                bonzilog("server", "", msg, null, msg, true);
            }
        } else {
            let bonzi = bonzis.get(key);
            bonzi.userPublic = public;
            bonzi.updateName();
            bonzi.updateTag();
            if (bonzi.color != public.color) {
                bonzi.color = public.color;
                bonzi.updateSprite();
            }
            safeBonzis.add(bonzi);
        }
    }
    for (let bonzi of bonzis.values()) {
        if (!safeBonzis.has(bonzi)) {
            bonzi.exit();
        }
    }
    usercount.innerText = usersPublic.size;
};

setInterval(() => {
    for (let bonzi of bonzis.values()) {
        bonzi.update();
    }
}, 66.67);

let socket = io("//");

let usersPublic = new Map;
let bonzis = new Map;

function login() {
    socket.emit("login", {
        name: login_name.value,
        room: login_room.value,
    });
    setup();
}

login_go.onclick = login;

login_room.value = window.location.hash.slice(1);

function loginOnEnter(e) {
    if (e.which == 13) login();
}

login_name.onkeypress = loginOnEnter;
login_room.onkeypress = loginOnEnter;

socket.on("ban", (data) => {
    autorejoin = false;
    page_ban.hidden = false;
    ban_reason.innerHTML = data.reason;
    ban_end.textContent = new Date(data.end).toString();
});

socket.on("kick", (data) => {
    autorejoin = false;
    page_kick.hidden = false;
    kick_reason.innerHTML = data.reason;
});

socket.on("loginFail", (data) => {
    login_card.hidden = false;
    login_load.hidden = true;
    login_error.hidden = false;
    login_error.textContent = `Error: ${data.reason}`;
});

socket.on("disconnect", () => {
    errorFatal();
    logJoins = false;
    socket.connect();
});

let typingTimeout = 0;

function errorFatal() {
    if (blockerror) return;
    if (!page_ban.hidden || page_kick.hidden) {
        page_error.hidden = false;
    }
}

function typing(bool) {
    if (bool) {
        if (!typingTimeout) {
            socket.emit("typing", 1);
        } else {
            clearTimeout(typingTimeout)
        }
        typingTimeout = setTimeout(() => {
            socket.emit("typing", 0);
            typingTimeout = 0;
        }, 2000);
    } else {
        if (typingTimeout) {
            socket.emit("typing", 0);
            clearTimeout(typingTimeout)
            typingTimeout = 0;
        }
    }
}

let joined = false;

function setup() {
    chat_send.onclick = sendInput;
    joined = true;


    chat_message.onkeypress = (e) => {
        if (e.which === 13) sendInput();
    };

    chat_message.oninput = () => {
        let value = chat_message.value;
        if (value.trim() === "") {
            typing(false);
        } else {
            typing(true);
        }
    };

}

socket.on("room", (data) => {
    page_error.hidden = true;
    room_owner.hidden = !data.isOwner;
    room_public.hidden = !data.isPublic;
    room_private.hidden = data.isPublic;
    room_id.textContent = data.room;
});

socket.on("updateAll", (data) => {
    page_login.hidden = true;
    usersPublic.clear();
    for (let [id, user] of entries(data.usersPublic)) {
        usersPublic.set(id, user);
    }
    bonzisCheck();
    logJoins = true;
});

socket.on("update", (data) => {
    usersPublic.set(data.guid, data.userPublic);
    bonzisCheck();
});

socket.on("talk", (data) => {
    let bonzi = bonzis.get(data.guid);
    bonzi.runEvent([{
        type: "text",
        text: data.text,
        quote: data.quote,
    }]);
});

socket.on("joke", (data) => {
    let bonzi = bonzis.get(data.guid);
    bonzi.rng = new seedrandom(data.rng);
    bonzi.cancel();
    bonzi.joke();
});

socket.on("youtube", (data) => {
    let bonzi = bonzis.get(data.guid);
    bonzi.cancel();
    bonzi.youtube(data.vid);
});

socket.on("fact", (data) => {
    let bonzi = bonzis.get(data.guid);
    bonzi.rng = new seedrandom(data.rng);
    bonzi.fact();
});

socket.on("backflip", (data) => {
    let bonzi = bonzis.get(data.guid);
    bonzi.backflip(data.swag);
});

socket.on("asshole", (data) => {
    let bonzi = bonzis.get(data.guid);
    bonzi.asshole(data.target);
});

socket.on("bass", (data) => {
    let bonzi = bonzis.get(data.guid);
    bonzi.bass(data.target);
});

socket.on("owo", (data) => {
    let bonzi = bonzis.get(data.guid);
    bonzi.owo(data.target);
});

socket.on("triggered", function (data) {
    let bonzi = bonzis.get(data.guid);
    bonzi.runEvent(bonzi.data.event_list_triggered);
});

socket.on("linux", (data) => {
    let bonzi = bonzis.get(data.guid);
    bonzi.runEvent(bonzi.data.event_list_linux);
});

socket.on("pawn", (data) => {
    let bonzi = bonzis.get(data.guid);
    bonzi.runEvent(bonzi.data.event_list_pawn);
});

socket.on("leave", (data) => {
    let bonzi = bonzis.get(data.guid);
    if (bonzi) {
        let msg = `${nmarkup(bonzi.userPublic.name)} has left.`;
        bonzilog("server", "", msg, null, msg, false);
        bonzi.exit();
    }
    bonzisCheck();
});

socket.on("poll", (data) => {
    let bonzi = bonzis.get(data.guid);
    bonzi.poll(data.poll, data.title);
});

socket.on("image", (data) => {
    let bonzi = bonzis.get(data.guid);
    bonzi.image(data.url);
});

socket.on("video", (data) => {
    let bonzi = bonzis.get(data.guid);
    bonzi.video(data.url);
});

socket.on("vote", (data) => {
    updatePoll(data.poll, data.guid, data.vote);
});

socket.on("french", (data) => {
    let bonzi = bonzis.get(data.guid);
    // bonzi.runEvent([{
    //     type: "text",
    //     text: data.text,
    //     french: true
    // }]);
    bonzi.runEvent([{
        type: "text",
        text: "{FRANCE} France is being fixed. Thanks for your understanding.",
        say: "France is being fixed. Thanks for your understanding.",
    }])
});

socket.on("nuke", (data) => {
    let bonzi = bonzis.get(data.guid);
    bonzi.explode();
});

function sendInput() {
    let text = chat_message.value;
    chat_message.value = "";
    typing(false);
    scope: if (text.length > 0) {
        let youtube = youtubeParser(text);
        if (youtube) {
            socket.emit("command", {
                list: ["youtube", youtube],
            });
            break scope;
        }

        if (quote) {
            socket.emit("talk", {
                text: text,
                quote: quote,
            });
        } else if (text[0] === "/") {
            let list = text.slice(1).split(" ");
            if (list[0] === "clear") {
                lastUser = "";
                chat_log_content.innerText = "";
            } else if (list[0] === "settings") {
                openSettings();
            } else if (list[0] === "sex" || list[0] === "dolphin") {
                dolphin();
            } else if (list[0] === "debug:bless") {
                blessedPopup();
            } else if (list[0] === "vaporwave") {
                document.body.classList.add("vaporwave");
            } else if (list[0] === "unvaporwave") {
                document.body.classList.remove("vaporwave");
            } else {
                socket.emit("command", {
                    list: list,
                });
            }
        } else {
            socket.emit("talk", {
                text: text,
            });
        }
    }
    quote = null;
    talkcard.hidden = true;
}

chat_log_button.onclick = () => {
    chat_log_button.hidden = true;
    chat_log.hidden = false;
    window.onresize();
};

chat_log_close.onclick = () => {
    chat_log_button.hidden = false;
    chat_log.hidden = true;
};

socket.on("connect", () => {
    setTimeout(() => {
        if (joined) {
            socket.emit("login", {
                name: login_name.value,
                room: login_room.value,
            });
        }
    }, 500);
});

class Dialog {
    constructor(opt = {}) {
        if (opt.title == null) opt.title = "Window";
        opt.width = opt.width || 400;
        opt.height = opt.height || 300;
        this.x = opt.x || 0;
        this.y = opt.y || 0;
        this.element = document.createElement("div");
        this.element.classList.add("window");
        if (opt.class) this.element.classList.add(opt.class);
        this.element.innerHTML = `
        <div class="window_header">
        ${sanitize(opt.title)}
        <div class="window_close"></div>
        </div>
        <div class="window_body"></div>
        `;
        this.move(this.x, this.y);
        this.element.style.position = "absolute";
        this.element.style.zIndex = lastZ++ + 9999;
        this.element.querySelector(".window_header").onpointerdown = (e) => {
            dragged = this;
            dragX = e.pageX - this.x;
            dragY = e.pageY - this.y;
        };
        this.element.querySelector(".window_close").onclick = () => {
            this.element.remove();
        };
        this.element.style.width = `${opt.width}px`;
        this.element.style.height = `${opt.height}px`;
        this.element.querySelector(".window_body").innerHTML = opt.html;
        content.appendChild(this.element);
    }

    move(x, y) {
        this.x = x;
        this.y = y;
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }
}

function initSettings() {
    localStorage.imageBlacklist = localStorage.imageBlacklist || "false";
    localStorage.classicBg = localStorage.classicBg || "false";
    localStorage.wordBlacklist = localStorage.wordBlacklist || "[]";
}

let wordBlacklist = [];

if (localStorage.length === 0) {
    initSettings();
} else try {
    wordBlacklist = JSON.parse(localStorage.wordBlacklist);
    if (!isArray(wordBlacklist)) throw TypeError("wordBlacklist is not an array");
    for (let word of wordBlacklist) {
        if (typeof word !== "string") throw TypeError("wordBlacklist is broken");
    }
    document.body.classList.toggle("classic", localStorage.classicBg === "true");
} catch (err) {
    console.error("Loading settings failed: ", err);
    initSettings();
}

function xpath(el, expr) {
    let result = el.getRootNode().evaluate(expr, el);
    switch (result.resultType) {
        case XPathResult.BOOLEAN_TYPE:
            return result.booleanValue;
        case XPathResult.NUMBER_TYPE:
            return result.numberValue;
        case XPathResult.STRING_TYPE:
            return result.stringValue;
        case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
            let list = [];
            let node;
            while (node = result.iterateNext()) {
                list.push(node);
            }
            return list;
    }
}

function exportSettings() {
    let xml = `<?xml version="1.0"?>
<settings>
    <hideImages on="${localStorage.hideImages === "true"}"/>
    <classicBg on="${localStorage.classicBg === "true"}"/>
`;
    let wordBlacklist = JSON.parse(localStorage.wordBlacklist);
    if (wordBlacklist.length > 0) {
        xml += "    <blacklist>\n"
        for (let word of wordBlacklist) {
            xml += `        <word>${sanitize(word)}</word>\n`
        }
        xml += "    </blacklist>\n"
    }
    xml += "</settings>";
    return xml;
}

function importSettings(xml) {
    let parser = new DOMParser();
    let settingsXML = parser.parseFromString(xml, "application/xml");
    let settings = settingsXML.documentElement;
    if (settingsXML.querySelector("parsererror")) {
        throw Error(`Parser error: ${settingsXML.querySelector("parsererror").textContent}`);
    } else if (settings.tagName !== "settings") {
        throw Error(`Root tag is <${settings.tagName}>, not <settings>`);
    }
    initSettings();
    localStorage.hideImages = xpath(settings, "string(./hideImages/@on)") === "true";
    localStorage.classicBg = xpath(settings, "string(./classicBg/@on)") === "true";
    wordBlacklist = [];
    for (let word of xpath(settings, "./blacklist/word")) {
        wordBlacklist.push(word.textContent);
    }
    localStorage.wordBlacklist = JSON.stringify(wordBlacklist);

    document.body.classList.toggle("classic", localStorage.classicBg === "true");
}

let settingsDialog;

function openSettings() {
    if (settingsDialog) {
        settingsDialog.element.remove();
    }
    settingsDialog = new Dialog({
        title: "Settings",
        class: "settings",
        html: `
            <div>
                <label><input type="checkbox" class="hide"> Hide Images</label><br>
                <label><input type="checkbox" class="classic"> Classic Background Color</label>
            </div>  
            <div class="blacklist">
                <header>Blacklisted words: </header>
                <textarea class="blacklist_words" placeholder="Newline-seperated list of blacklisted words."></textarea>
            </div>
            <div class="button_row">
                <button class="import">Import</button>
                <button class="export">Export</button>
            </div>
        `,
        width: 600,
        height: 400,
        x: 20,
        y: 20
    });
    let element = settingsDialog.element;
    let hideImages = element.querySelector(".hide");
    let classicBg = element.querySelector(".classic");
    let blacklist = element.querySelector(".blacklist_words");
    let add = element.querySelector(".add");
    hideImages.checked = localStorage.hideImages === "true";
    classicBg.checked = localStorage.classicBg === "true";
    hideImages.oninput = () => {
        localStorage.hideImages = hideImages.checked;
    }
    classicBg.oninput = () => {
        localStorage.classicBg = classicBg.checked;
        document.body.classList.toggle("classic", classicBg.checked);
    }
    blacklist.value = wordBlacklist.join("\n");
    blacklist.oninput = () => {
        let words = blacklist.value.split("\n");
        wordBlacklist = [];
        for (let word of words) {
            word = word.trim();
            if (word.length > 0) {
                wordBlacklist.push(word);
            }
        }
        localStorage.wordBlacklist = JSON.stringify(wordBlacklist);
    }
    element.querySelector(".export").onclick = () => {
        exportWindow();
    }
    element.querySelector(".import").onclick = () => {
        importWindow();
    }
}

function exportWindow() {
    let dialog = new Dialog({
        title: "Export Settings",
        class: "export_window",
        html: `
            <textarea class="export fill" readonly></textarea>
        `,
        width: 400,
        height: 300,
        x: 100,
        y: 100
    });
    let element = dialog.element;
    let exportText = element.querySelector(".export");
    exportText.value = exportSettings();
    exportText.focus();
}

function importWindow() {
    let dialog = new Dialog({
        title: "Import Settings",
        class: "import_window",
        html: `
            <textarea class="import fill" placeholder="Paste your settings here."></textarea>
            <div class="button_row">
                <button class="import_button">Import</button>
            </div>
        `,
        width: 400,
        height: 300,
        x: 100,
        y: 100
    });
    let element = dialog.element;
    let importText = element.querySelector(".import");
    importText.focus();
    element.querySelector(".window_close").onclick = () => {
        dialog.element.remove();
    }
    element.querySelector(".import_button").onclick = () => {
        let text = importText.value;
        try {
            let lastX = settingsDialog.x;
            let lastY = settingsDialog.y;
            importSettings(text);
            openSettings();
            settingsDialog.move(lastX, lastY);
        } catch (err) {
            new Dialog({
                title: "Error",
                class: "flex_window",
                html: `<div class="fill center"><span>${markup(err.message)}</span></div>`,
                width: 400,
                height: 200,
                x: 100,
                y: 100,
            });
        }
    }
}

let gravity = false;

function dolphin() {
    if (!gravity) {
        gravity = true;
        $("#content").jGravity({
            target: ".bonzi",
            depth: Infinity,
        });
    }
}

function cmd(str) {
    socket.emit("command", { list: str.split(" ") });
}

function blessedPopup() {
    new Dialog({
        title: "Blessmode",
        class: "flex_window",
        html: `
            <div class="blessed_body">
                <h1><marquee>YOU'VE BEEN BLESSED!</marquee></h1>
                Blessed is a VIP-like status given to users who I like.<br>
                You now have access to:<br>
                <ul>
                    <li> <b>Mutlihatting</b>: Use the /hat command with up to 3 hats. Try <var>/hat dank tophat</var>.
                    <li> <b>Skins:</b> 3 custom skins
                    <li> <b>Hats:</b> 3 extra hats
                </ul>
                <h3>Skins</h3>
                <div class="roulette">
                    <div class="card angel" onclick="cmd('angel')"></div>
                    <div class="card glow" onclick="cmd('glow')"></div>
                    <div class="card noob" onclick="cmd('noob')"></div>
                </div>
                <h3>Hats</h3>
                <div class="roulette">
                    <div class="cardhat dank" onclick="cmd('hat dank')"></div>
                    <div class="cardhat illuminati" onclick="cmd('hat illuminati')"></div>
                    <div class="cardhat cigar" onclick="cmd('hat cigar')"></div>
                    <div class="cardhat bear" onclick="cmd('hat bear')"></div>
                </div>
            </div>
        `,
        x: 300,
        y: 400,
        width: 600,
        height: 400,
    })
}

socket.on("blessed", blessedPopup);
socket.on("king", () => king = true);
socket.on("admin", () => admin = true);
socket.on("trusted", () => trusted = true);
socket.on("nuked", () => setTimeout(() => { blockerror = true; location.reload() }, 4000));

function resetRainbow (el) {
    for (let anim of el.getAnimations()) {
        if (anim.animationName === "move") anim.startTime = 0;
    }
}

const rainbowSelector = "gay-rainbow,gay-spoiler,code"; // can have anims

const observer = new MutationObserver(mutations => {
    for (let mutation of mutations) {
        for (let node of mutation.addedNodes) {
            if (!(node instanceof Element)) continue;

            if (node.matches(rainbowSelector)) {
                resetRainbow(node);
            }

            node.querySelectorAll(rainbowSelector).forEach(resetRainbow);
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });
