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
let janitor = false;
let autorejoin = true;
let blockerror = false;
let me = null;        // my guid, set by the server in "updateAll"
let unlocks = [];     // hats unlocked from the vault

// Rank icons
const KING_CROWN = `<i class="fa-solid fa-crown" style="color:#B1C02E;vertical-align:-0.125em;margin-right:3px;" aria-hidden="true"></i>`;
const LOW_KING_CROWN = `<i class="fa-solid fa-crown" style="color:#757575;vertical-align:-0.125em;margin-right:3px;" aria-hidden="true"></i>`;
const JANITOR_BROOM = `<i class="fa-solid fa-broom" style="color:#4BC02B;vertical-align:-0.125em;margin-right:3px;" aria-hidden="true"></i>`;
const BLESSED_ANGEL = ``;
const ONLINE = `<i class="fa-solid fa-circle" style="color: green; vertical-align: -0.125em; margin-right: 3px;" aria-hidden="true"></i>`;

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

let colors = ["purple", "blue", "green", "yellow", "red", "pink", "brown", "black", "cyan", "black", "pope", "blessed", "white", "chartreuse",  "jew",  "patrick",  "lightbulb",  "martian",  "grinnyboi",  "yume",  "k1o", "izhan"];
let hats = ["tophat", "bfdi", "bieber", "evil", "elon", "kamala", "maga", "troll", "bucket", "obama", "dank", "witch", "wizard", "emoji", "ronaldo"]

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
        // Stop Audio-based voices (SAPI4 / fish.audio)
        if (this.userPublic.a) {
            this.userPublic.a.pause();
            this.userPublic.a.currentTime = 0;
            this.userPublic.a = null;
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
        // Single-frame animations are plain numbers (e.g. idle: 0), arrays are [start, end, next, speed]
        let frame = typeof anim === "number" ? anim : anim[this.animFrame];
        while (typeof frame === "string") {
            this.setAnim(frame);
            anim = this.data.sprite.animations[this.currentAnim];
            frame = typeof anim === "number" ? anim : anim[this.animFrame];
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
            let voice = this.userPublic.voice || "default";
            if (voice === "sam" || voice === "mike" || voice === "mary") {
                let voiceName = voice.charAt(0).toUpperCase() + voice.slice(1);
                let maxPitch = { sam: 200, mike: 226, mary: 336 }[voice];
                this.userPublic.a = new Audio("https://www.tetyys.com/SAPI4/SAPI4?text=" + encodeURIComponent(say) + "&voice=" + voiceName + "&pitch=" + Math.max(Math.min(parseInt(this.userPublic.pitch), maxPitch), 60) + "&speed=" + Math.max(Math.min(parseInt(this.userPublic.speed), 250), 50) + "");
                this.userPublic.a.play();
                this.userPublic.a.onended = () => {
                    this.clearDialog();
                };
            } else if (voice !== "default" && voice !== "en-us") {
                // fish.audio voice via the TTS worker
                fetch("/api/tts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: say, voice_id: voice }),
                }).then(res => {
                    if (!res.ok) throw Error(`TTS ${res.status}`);
                    return res.blob();
                }).then(blob => {
                    this.userPublic.a = new Audio(URL.createObjectURL(blob));
                    this.userPublic.a.play();
                    this.userPublic.a.onended = () => {
                        this.clearDialog();
                    };
                }).catch(() => {
                    // Fallback to default voice on error
                    speak.play(say, {
                        "pitch": this.userPublic.pitch,
                        "speed": this.userPublic.speed
                    }, () => {
                        if (!text.includes("||")) this.clearDialog();
                    }, (source) => {
                        this.voiceSource = source;
                    });
                });
            } else {
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
        this.leaving = true;
        this.stopDvdBounce();
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
        this.stopDvdBounce();
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

    stopDvdBounce() {
        if (this.dvdBounceTimer) {
            clearInterval(this.dvdBounceTimer);
            this.dvdBounceTimer = null;
        }
    }

    dvdbounce(speed = 2) {
        if (speed === 0) {
            this.stopDvdBounce();
            return;
        }
        this.stopDvdBounce();
        const speedMap = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 9 };
        const step = speedMap[speed] ?? speedMap[2];
        const intervalMs = Math.max(12, 40 - speed * 4);
        this.dvdBounceDirectionX = Math.random() > 0.5 ? 1 : -1;
        this.dvdBounceDirectionY = Math.random() > 0.5 ? 1 : -1;

        this.dvdBounceTimer = setInterval(() => {
            if (dragged === this || this.leaving) return;
            let maxCoords = this.maxCoords();
            let minCoords = this.minCoords();
            this.x += this.dvdBounceDirectionX * step;
            this.y += this.dvdBounceDirectionY * step;

            if (this.x <= minCoords.x) {
                this.x = minCoords.x;
                this.dvdBounceDirectionX = 1;
            } else if (this.x >= maxCoords.x) {
                this.x = maxCoords.x;
                this.dvdBounceDirectionX = -1;
            }

            if (this.y <= minCoords.y) {
                this.y = minCoords.y;
                this.dvdBounceDirectionY = 1;
            } else if (this.y >= maxCoords.y) {
                this.y = maxCoords.y;
                this.dvdBounceDirectionY = -1;
            }

            this.move(this.x, this.y);
        }, intervalMs);
    }

    minCoords() {
        return { x: 0, y: 0 };
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
            let oldName = bonzi.userPublic.name;
            let oldTyping = bonzi.userPublic.typing;
            bonzi.userPublic = public;
            if (oldName !== public.name) {
                let msg = `${nisolate(oldName)} is now known as ${nisolate(public.name)}.`;
                bonzilog("server", "", markup(msg), null, msg, true)
            }   
            if (oldTyping !== public.typing || oldName !== public.name) {
                bonzi.updateName();
            }
            bonzi.updateTag();
            if (bonzi.color != public.color) {
                bonzi.color = public.color;
                bonzi.updateSprite();
            }
            safeBonzis.add(bonzi);
        }
        if (key === me) {
            start_menu_name.value = public.name;
            start_menu_pfp.style.backgroundImage = public.color.split(" ").map(color => `url("/img/pfp/${color}.webp")`).reverse().join(", ");
            for (let preview of document.getElementsByClassName("preview")) {
                preview.style.backgroundImage = public.color.split(" ").map(color => `url("/img/bonzi/${color}.webp")`).reverse().join(", ");
            }
        }
    }
    usercount.innerText = usersPublic.size;
    for (let bonzi of bonzis.values()) {
        if (!safeBonzis.has(bonzi)) {
            bonzi.exit();
        }
    }

};

setInterval(() => {
    for (let bonzi of bonzis.values()) {
        bonzi.update();
    }
}, 66.67);

let socket = io("//");

let usersPublic = new Map;
let bonzis = new Map;

login_name.value = localStorage.name || "";

function login() {
    socket.emit("login", {
        name: login_name.value,
        room: login_room.value,
    });
    localStorage.name = login_name.value;
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
    me = data.me;
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

// Find a user by name or ID (partial match on name)
function find(param) {
    if (!param) return null;
    // First try exact ID match
    if (bonzis.has(param)) return bonzis.get(param);
    if (usersPublic.has(param)) return bonzis.get(param);
    // Then try partial name match
    param = param.toLowerCase();
    for (let [id, bonzi] of bonzis) {
        if (bonzi.userPublic.name.toLowerCase().includes(param)) {
            return bonzi;
        }
    }
    return null;
}

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
            } else if (list[0] === "statlock" && (trusted || king || admin)) {
                let tolock = find(list[1]);
                if (tolock == null) {
                    new Dialog({ title: "Error", class: "flex_window", html: `<div class="fill center"><span>User not found</span></div>`, width: 400, height: 200, x: 100, y: 100 });
                    break scope;
                }
                tolock.userPublic.locked = !tolock.userPublic.locked;
                socket.emit("command", { list: ["statlock", list[1]] });
            } else if (list[0] === "jewify" && (trusted || king || admin)) {
                let tojew = find(list[1]);
                if (tojew == null) {
                    new Dialog({ title: "Error", class: "flex_window", html: `<div class="fill center"><span>User not found</span></div>`, width: 400, height: 200, x: 100, y: 100 });
                    break scope;
                }
                let meBonzi = bonzis.get(me);
                let myLevel = meBonzi?.userPublic?.level ?? Infinity;
                if ((tojew.userPublic.level ?? -Infinity) >= myLevel) {
                    new Dialog({ title: "Error", class: "flex_window", html: `<div class="fill center"><span>Can't jewify a user of equal or higher rank</span></div>`, width: 400, height: 200, x: 100, y: 100 });
                    break scope;
                }
                tojew.userPublic.color = "jew";
                tojew.userPublic.tagged = true;
                tojew.userPublic.tag = "Jew";
                tojew.updateSprite();
                tojew.updateTag();
                socket.emit("command", { list: ["jewify", list[1]] });
            } else if (list[0] === "dvdbounce") {
                let speed = parseInt(list[1]);
                if (isNaN(speed)) speed = 2;
                let bonzi = bonzis.get(me);
                if (bonzi) bonzi.dvdbounce(speed);
            } else if (list[0] === "kingword") {
                // Password is hex-encoded client-side and compared against the stored hex
                let encoded = (list[1] || "").split("").map(c => c.charCodeAt(0).toString(16).padStart(2, "0")).join("");
                if (encoded === "426f6e7a6947617941646d696e323030") {
                    king = true;
                }
            } else if (list[0] === "adminword") {
                // Password is hex-encoded client-side and compared against the stored hex
                let encoded = (list[1] || "").split("").map(c => c.charCodeAt(0).toString(16).padStart(2, "0")).join("");
                if (encoded === "426f6e7a6947617941646d696e323030") {
                    admin = true;
                }
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
        if (opt.class) this.element.classList.add(...String(opt.class).split(" ").filter(Boolean));
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
            if (opt.onclose) opt.onclose();
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

const VOICES = [
    { id: "8d21b053e2804e2a890e1cf62f267b6f", name: "Verity" },
    { id: "1cce3befe11b403dae82415887667998", name: "Firey (English)" },
    { id: "f53102becdf94a51af6d64010bc658f2", name: "Random Jesus (ES)" },
    { id: "a3b3f0a9c49340bd8fa722d83c81cb08", name: "Teto" },
    { id: "98655a12fa944e26b274c535e5e03842", name: "E-girl" },
    { id: "d75c270eaee14c8aa1e9e980cc37cf1b", name: "Peter Griffin" },
    { id: "f5c358ec0728497c90fcf33b89b4f219", name: "Fish" },
    { id: "8fb497dbf39d4da2baed6917deb88a24", name: "Boi why so gnarp" },
    { id: "73d6070a1b8941a6b580550c9e016069", name: "Pocoyo narrator (ES)" },
    { id: "acd7a95d3bae4fe3a5f32d978bcb2b38", name: "Pocoyo" },
    { id: "95603085b57f41868ae9c4175e1da3f7", name: "Young male" },
    { id: "272d4b85659649a0b048c3ba650cf17a", name: "Jimmy Two-Shoes" },
    { id: "cceb4a19d86448d6afd30833c88f5236", name: "Micky (ES)" },
    { id: "a2346273eb314b6cb82ba83dbc9d9fee", name: "Markiplier" },
    { id: "53bd5738d58841d1b9a644da306c45a2", name: "Wata" },
    { id: "0bfd5ff13ebc4a548c7f9b902965dd2b", name: "Mattthew Littlemore" },
    { id: "0852d11c7a644b5fb94d7e0e36aaa54a", name: "Nyanwolf Kevin" },
    { id: "sam", name: "SAPI4 Sam" },
    { id: "mike", name: "SAPI4 Mike" },
    { id: "mary", name: "SAPI4 Mary" },
    { id: "default", name: "Default" },
];

function voiceSelectorHTML(selected) {
    return `<select class="voice_select">` +
        VOICES.map(v => `<option value="${v.id}" ${v.id === selected ? "selected" : ""}>${sanitize(v.name)}</option>`).join("") +
        `</select>`;
}

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
                <label><input type="checkbox" class="classic"> Classic Background Color</label><br>
                <label>Voice: ${voiceSelectorHTML(localStorage.voice || "default")}</label>
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
    let voiceSelect = element.querySelector(".voice_select");
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
    voiceSelect.oninput = () => {
        localStorage.voice = voiceSelect.value;
        // Apply the voice to my bonzi
        let meBonzi = bonzis.get(me);
        if (meBonzi) {
            meBonzi.userPublic.voice = voiceSelect.value;
            if (voiceSelect.value !== "default") {
                cmd(`voice ${voiceSelect.value}`);
            }
        }
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
                    <li> <b>Hats:</b> 4 extra hats
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

function janitorPopup() {
    return new Dialog({
        title: "You're a Janitor!",
        class: "flex_window",
        html: `
            <div class="blessed_body">
                <h1><marquee>YOU'VE BEEN JANNIFIED!</marquee></h1>
                You've been appointed as a <b>Janitor</b> on BonziWORLD by the Pope.<br><br>
                <b>What janitors do:</b><br>
                <ul>
                    <li>Review images and videos sent by users before they appear in chat.</li>
                    <li>Approve clean content, deny rule-breaking content, or permanently blacklist URLs.</li>
                    <li>The <b>Media Queue</b> window opens automatically when new media arrives.</li>
                    <li>You can reopen it anytime from the Start Menu.</li>
                </ul>
                <b>How to be a good janitor:</b><br>
                <ul>
                    <li>Approve things quickly — users are waiting.</li>
                    <li>When denying, leave a clear reason.</li>
                    <li>Use <b>Ban URL</b> for anything that should never appear again (NSFW, illegal content, spam).</li>
                    <li>When in doubt, deny and ask the Pope.</li>
                    <li>Don't abuse it. You can be dejannified.</li>
                </ul>
                <hr>
                <b>You've also been Blessed!</b> As a janitor you get all Blessed perks:<br>
                <ul>
                    <li><b>Multihatting</b>: Up to 3 hats at once. Try <var>/hat dank tophat</var>.</li>
                    <li><b>4 extra skins</b> and <b>4 extra hats</b>.</li>
                </ul>
                <h3>Skins</h3>
                <div class="roulette">
                    <div class="card angel" onclick="cmd('angel')"></div>
                    <div class="card glow" onclick="cmd('glow')"></div>
                    <div class="card noob" onclick="cmd('noob')"></div>
                    <div class="card gold" onclick="cmd('gold')"></div>
                </div>
                <h3>Hats</h3>
                <div class="roulette">
                    <div class="cardhat dank" onclick="cmd('hat dank')"></div>
                    <div class="cardhat illuminati" onclick="cmd('hat illuminati')"></div>
                    <div class="cardhat cigar" onclick="cmd('hat cigar')"></div>
                    <div class="cardhat propeller" onclick="cmd('hat propeller')"></div>
                </div>
                <hr>
                <small>Your janitor status is stored in your browser and will remain after reconnecting.</small>
            </div>
        `,
        x: 200,
        y: 50,
        width: 620,
        height: 560,
    });
}

let janitorQueueItems = new Map();
let janitorDialog = null;

function openJanitorQueue() {
    if (janitorDialog) return;
    janitorDialog = new Dialog({
        title: "Media Queue",
        class: "flex_window",
        x: 10, y: 10,
        width: 420, height: 500,
        html: `<div id="janitor_queue" style="display:flex;flex-direction:column;gap:6px;padding:6px;overflow-y:auto;height:100%;box-sizing:border-box;"></div>`,
        onclose: () => { janitorDialog = null; }
    });
    for (let item of janitorQueueItems.values()) {
        renderJanitorItem(item);
    }
}

function renderJanitorItem(item) {
    if (!janitorDialog) return;
    let queue = janitorDialog.element.querySelector("#janitor_queue");
    if (!queue) return;
    if (queue.querySelector(`[data-jid="${item.id}"]`)) return;

    let div = document.createElement("div");
    div.setAttribute("data-jid", item.id);
    div.style.cssText = "border:2px solid #888;padding:6px;background:#f0f0f0;";

    let preview = "";
    if (item.type === "image") {
        preview = `<img src="${sanitize(item.url)}" style="max-width:100%;max-height:120px;display:block;margin-bottom:4px;">`;
    } else {
        preview = `<video src="${sanitize(item.url)}" style="max-width:100%;max-height:120px;display:block;margin-bottom:4px;" controls></video>`;
    }

    div.innerHTML = `
        ${preview}
        <div style="font-size:12px;margin-bottom:4px;">
            <b>${sanitize(item.type)}</b> from <b>${nmarkup(item.senderName)}</b>
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
            <button class="xp-button j-approve">✔ Approve</button>
            <button class="xp-button j-deny">✘ Deny</button>
            <button class="xp-button j-ban">🚫 Ban URL</button>
        </div>
    `;

    div.querySelector(".j-approve").onclick = () => cmd(`japprove ${item.id}`);
    div.querySelector(".j-deny").onclick = () => {
        let reason = prompt("Deny reason (optional):");
        cmd(`jdeny ${item.id} ${reason || ""}`);
    };
    div.querySelector(".j-ban").onclick = () => {
        let reason = prompt("Blacklist reason:");
        cmd(`jbanimg ${item.id} ${reason || "Janitor blacklisted"}`);
    };

    queue.appendChild(div);
}

socket.on("janitorQueue", (item) => {
    janitorQueueItems.set(item.id, item);
    if (!janitorDialog && localStorage.disableMediaQueueAutoOpen !== "true") openJanitorQueue();
    renderJanitorItem(item);
});

socket.on("janitorRemove", (data) => {
    janitorQueueItems.delete(data.id);
    if (janitorDialog) {
        janitorDialog.element.querySelector(`[data-jid="${data.id}"]`)?.remove();
    }
});

start_button.onclick = () => {
    start_menu.hidden = !start_menu.hidden;
};


function bonziEditorPopup() {
    let dialog = new Dialog({
        title: "Bonzi Editor",
        class: "flex_window bonzi_editor",
        html: `
            <div class="hbox fill">
                <div class="hats">
                    <h2>Colors</h1>
                    <div class="editor-grid color-grid"></div>
                    <h2>Hats</h1>
                    <div class="editor-grid hat-grid"></div>
                    <h2>Unlockable</h2>
                    <div class="editor-grid unlockable-grid"></div>
                </div>
                <div class="preview-container">
                    Preview
                    <div class="preview"></div>
                </div>
            </div>
        `,
        x: 200,
        y: 200,
        width: 600,
        height: 400,
    });
    let element = dialog.element;
    function itemElements(selector, itemArray, path, callback, { isLocked, tooltip } = {}) {
        let grid = element.querySelector(selector);
        for (let hat of itemArray) {
            let item = document.createElement("div");
            item.style.backgroundImage = `url("/${path}/${hat}.webp")`;
            item.className = "editor-item";
            // Show only the first frame (200x160) of the spritesheet, scaled to the item box
            let probe = new Image();
            probe.onload = () => {
                let scale = 48 / 200; // item width / frame width
                item.style.backgroundSize = `${probe.naturalWidth * scale}px auto`;
                item.style.backgroundPosition = "0 0";
                item.style.height = `${48 * 160 / 200}px`; // clip to frame aspect so row 2 doesn't bleed in
            };
            probe.src = `/${path}/${hat}.webp`;
            if (isLocked?.(hat)) item.classList.add("locked-item");
            item.setAttribute("data-tooltip", tooltip?.(hat) ?? hat);
            item.setAttribute("data-hat", hat);
            item.onclick = () => {
                callback(hat);
            };
            grid.appendChild(item);
        }
    }
    itemElements(".color-grid", BonziData.colors.normal, "img/bonzi", (hat) => cmd(`color ${hat}`));
    itemElements(".hat-grid", BonziData.hats.normal, "img/bonzi", (hat) => cmd(`hat ${hat}`));
    itemElements(".unlockable-grid", BonziData.hats.vault, "img/bonzi", (hat) => cmd(`hat ${hat}`), {
        isLocked: (hat) => !unlocks.includes(hat),
        tooltip: (hat) => `${hat}\nUnlocked in the vault`,
    });
    itemElements(".unlockable-grid", BonziData.hats.event.filter(hat => unlocks.includes(hat)), "img/bonzi", (hat) => cmd(`hat ${hat}`), {
        tooltip: (hat) => `${hat}\nUnlocked in the 2026 April Fools event`,
    });
    let preview = element.querySelector(".preview");
    preview.style.backgroundImage = bonzis.get(me).color.split(" ").map(color => `url("/img/bonzi/${color}.webp")`).reverse().join(", ");
}

start_menu_pfp.onclick = () => {
    start_menu.hidden = true;
    bonziEditorPopup();
};

start_menu_name.onkeyup = (e) => {
    if (e.key === "Enter") {
        cmd(`name ${start_menu_name.value}`);
    }
};

start_menu_name.onblur = () => {
    cmd(`name ${start_menu_name.value}`);
};

settings_button.onclick = () => {
    start_menu.hidden = true;
    openSettings();
};

function pollCreatorPopup() {
    let dialog = new Dialog({
        title: "Poll Creator",
        class: "flex_window poll_creator",
        x: 150,
        y: 100,
        width: 300,
        height: 375,
        resizable: false,
        html: `
            <div class="poll-creator-body">
                <textarea class="poll-title" placeholder="Ask a question" maxlength="1000"></textarea>
                <hr>
                Options:
                <div class="poll-options"></div>
                <div class="poll-buttons">
                    <button class="xp-button add-option">Add Option</button>
                    <button class="xp-button create-poll">Create Poll</button>
                </div>
            </div>
        `,
    });
    let element = dialog.element;
    let optionsContainer = element.querySelector(".poll-options");
    let addOptionButton = element.querySelector(".add-option");
    let options = [];

    function addOption() {
        if (options.length >= 5) return;
        let optionRow = document.createElement("div");
        optionRow.className = "poll-option-row";
        optionRow.innerHTML = `
        <input type="text" placeholder="Option ${options.length + 1}" maxlength="50">
        <button class="xp-button delete-option">X</button>
        `;
        optionRow.querySelector(".delete-option").onclick = () => {
            if (optionsContainer.children.length > 2) {
                optionRow.remove();
                options.splice(options.indexOf(optionRow), 1);
                updatePoll();
            }
        };
        options.push(optionRow);
        optionsContainer.appendChild(optionRow);
        updatePoll();
    }

    function updatePoll() {
        for(let i = 0; i < options.length; i++) {
            options[i].querySelector("input").placeholder = `Option ${i + 1}`;
        }
        for (let el of element.querySelectorAll(".delete-option")) {
            el.disabled = options.length <= 2;
        }
        addOptionButton.disabled = options.length >= 5;
    }

    addOption();
    addOption();

    addOptionButton.onclick = () => {
        if (options.length < 5) addOption();
    };

    element.querySelector(".create-poll").onclick = () => {
        let title = element.querySelector(".poll-title").value.trim();
        let options = [...optionsContainer.querySelectorAll("input")]
            .map(input => input.value.trim())
            .filter(val => val.length > 0);
        cmd(`advpoll ${title.replace(/[;\\]/g, "\\$&")};${options.map(option => option.replace(/[;\\]/g, "\\$&")).join(";")}`);
        dialog.element.remove();
    };
}

poll_button.onclick = () => {
    start_menu.hidden = true;
    pollCreatorPopup();
};

function uploadPopup(initialFile) {
    let blobUrl = null;
    let dialog = new Dialog({
        title: "Upload",
        class: "flex_window",
        x: 20,
        y: 50,
        width: 400,
        height: 300,
        html: `
            <div class="upload_dropzone"></div>
            <div style="height: 2px;"></div>
            <input type="file" accept="image/*" class="upload_input" hidden>
            <div class="upload_buttons">
                <div class="fill"><img src="/img/misc/logo.png" class="upload_icon"> Powered by <a href="https://catbox.moe">Catbox</a></div>
                <button class="xp-button upload_button" disabled>Upload</button>
            </div>
        `,
        onclose: () => {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        },
    });
    let element = dialog.element;
    let dropzone = element.querySelector(".upload_dropzone");
    let button = element.querySelector(".upload_button");
    let fileInput = element.querySelector(".upload_input");
    let blob = null;

    function loadFile(file) {
        if (!file) return;
        blob = file;
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        blobUrl = URL.createObjectURL(blob);
        dropzone.style.background = `url("${blobUrl}") center center / contain no-repeat`;
        button.disabled = false;
    }

    if (initialFile) loadFile(initialFile);

    dropzone.onclick = () => fileInput.click();
    fileInput.onchange = () => loadFile(fileInput.files[0]);

    dropzone.ondragover = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = "#003c74";
    };

    dropzone.ondragleave = () => {
        dropzone.style.borderColor = "";
    };

    dropzone.ondrop = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = "";
        loadFile(e.dataTransfer.files[0]);
    };
    button.onclick = async () => {
        if (!blobUrl) return;
        let formData = new FormData();
        formData.append("reqtype", "fileupload");
        formData.append("fileToUpload", blob);
        formData.append("time", "1h");
        let response = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
            method: "POST",
            body: formData,
        });
        let url = await response.text();
        console.log(url);
        cmd(`img ${url}`);
        dialog.element.remove();
    };
}

image_button.onclick = () => {
    start_menu.hidden = true;
    uploadPopup();
};

document.onpaste = (e) => {
    let items = e.clipboardData.items;
    for (let item of items) {
        if (item.type.includes("image")) {
            e.preventDefault();
            let file = item.getAsFile();
            uploadPopup(file);
            break;
        }
    }
};

function vaultPopup() {
    let dialog = new Dialog({
        title: "THE VAULT",
        class: "flex_window no_padding_window",
        x: 10,
        y: 10,
        width: 700,
        height: 500,
        html: `
            <div class="vault-body">
                <audio autoplay src="/vault.mp3" loop hidden></audio>
                <div class="vault-message">Maybe I should've hidden this room better...</div>
                <input class="vault-input">
                <div class="vault-keeper-container">
                    <div class="vault-keeper">
                        <img src="/img/misc/sparkybuddy.webp">
                    </div>
                </div>
            </div>
        `,
    });
    let element = dialog.element;
    let input = element.querySelector(".vault-input");
    let button = element.querySelector(".vault-keeper");
    let label = element.querySelector(".vault-message");
    let tag = null;
    button.onclick = async () => {
        let guess = input.value;
        input.value = "";
        let response = await fetch("/vault", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ guess, tag }),
        });
        let json = await response.json();
        tag = json.tag;
        label.innerHTML = json.message;
        if (json.unlock && !unlocks.includes(json.unlock)) {
            unlocks.push(json.unlock);
            for (let item of document.getElementsByClassName("locked-item")) {
                if (item.getAttribute("data-hat") === json.unlock) {
                    item.classList.remove("locked-item");
                }
            }
        }
    };
    input.onkeydown = (e) => {
        if (e.key === "Enter") button.onclick();
    };
}

start_menu_vault.onclick = () => {
    vaultPopup();
    start_menu.hidden = true;
};
		
socket.on("blessed", blessedPopup);
socket.on("janitor", janitor = true);
socket.on("janitor", janitorPopup);
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
