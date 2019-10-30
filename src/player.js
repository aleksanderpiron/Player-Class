const noUiSlider = require('./nouislider.min.js');
const downloadJs = require('./download.min.js');

class Player {
    constructor(audioElId){
        this.audioEl = document.getElementById(audioElId);
        this.playerEl = null;
        this.interval = null;
    }
    play(){
        if(this.audioEl.paused){
            this.audioEl.play();
            this.interval = setInterval(()=>{
                this.update();
            }, 100);
        }else{
            this.audioEl.pause();
            clearInterval(this.interval);
        }
    }
    update(){
        if (this.audioEl.currentTime > 0) {
            const value = ((this.audioEl.currentTime / this.audioEl.duration) * 100).toFixed(3);
            this.progressEl.style.width = value + "%";
        }
        this.currentTimerVal = {
            minutes: Math.floor(this.audioEl.currentTime / 60),
            seconds: Math.floor(this.audioEl.currentTime - Math.floor(this.audioEl.currentTime / 60) * 60),
        }
        this.currentTimerEl.minutes.innerHTML = this.currentTimerVal.minutes>9?this.currentTimerVal.minutes:'0'+this.currentTimerVal.minutes;
        this.currentTimerEl.seconds.innerHTML = this.currentTimerVal.seconds>9?this.currentTimerVal.seconds:'0'+this.currentTimerVal.seconds;
    }
    download(){
        downloadJs(this.audioEl.currentSrc);
    }
    changeVolume(value, action){
        if(value && !action){
            this.audioEl.volume = value;
        }
        else if(!value && action === 'up' && this.audioEl.volume.toFixed(2) < 1){
            this.audioEl.volume += 0.1;
        }
        else if(!value && action === 'down' && this.audioEl.volume.toFixed(2) > 0){
            this.audioEl.volume -= 0.1;
        }
        this.volumeBarEl.noUiSlider.set(this.audioEl.volume);
    }
    selectCurrentTime(event, action){
        let time;
        if(event && !action){
            const value = ((event.offsetX / this.progressBarEl.offsetWidth) * 100).toFixed(3);
            time = (this.audioEl.duration / 100) * value;
            this.progressEl.style.width = value + "%";
        }
        else if(!event && action === 'forward'){
            time = this.audioEl.currentTime + 5;
        }
        else if(!event && action === 'backwards'){
            time = this.audioEl.currentTime - 5;
        };
        if(time < 0){
            time = 0;
        }
        else if(time > this.audioEl.duration){
            time = this.audioEl.duration;
        }
        this.audioEl.currentTime = time;
        this.update();
    }
    handleKeyboard(event){
        switch(event.keyCode){
            case 37:
                this.selectCurrentTime(null, 'backwards');
            break;
            case 38:
                this.changeVolume(null, 'up');
            break;
            case 39:
                this.selectCurrentTime(null, 'forward');
            break;
            case 40:
                this.changeVolume(null, 'down');
            break;
            case 32:
                if(event.target.tagName !== 'BUTTON'){
                    this.play();
                }
            break;
            default:
                return true;
        }
    }
    static init(){
        const players = document.querySelectorAll('audio');
        for (const audioEl of players){
                const el = new Player(audioEl.id);
                el.audioEl.insertAdjacentHTML('afterend', `
                <div class="audio-player" tabindex="1" data-player='${audioEl.id}'>
                    <button alt="Przycisk - odtwórz" tabindex="-1" class="btn-play">Play</button>
                    <div class="volume-bar"></div>
                    <div class="time">
                        <span class="current">
                            <span class="minutes"></span>:<span class="seconds"></span>
                        </span>
                        /
                        <span class="total">
                            <span class="minutes"></span>:<span class="seconds"></span>
                        </span>
                    </div>
                    <div class="progress-bar">
                        <span class="progress"></span>
                    </div>
                    <button class="btn-download">Download</button>
                </div>
                `);
                el.playerEl = document.querySelector(`.audio-player[data-player="${audioEl.id}"]`);
                el.playBtnEl = el.playerEl.querySelector('.btn-play');
                el.downloadBtnEl = el.playerEl.querySelector('.btn-download');
                el.progressEl = el.playerEl.querySelector('.progress');
                el.progressBarEl = el.playerEl.querySelector('.progress-bar');
                el.volumeBarEl = el.playerEl.querySelector('.volume-bar');
                el.currentTimerEl = {
                    minutes: el.playerEl.querySelector('.time .current .minutes'),
                    seconds: el.playerEl.querySelector('.time .current .seconds'),
                }
                el.totalTimerEl = {
                    minutes: el.playerEl.querySelector('.time .total .minutes'),
                    seconds: el.playerEl.querySelector('.time .total .seconds'),
                }

            //TIME COUNTER INIT
                const initTimersVal = ()=>{
                    el.totalTimerVal = {
                        minutes: Math.floor(audioEl.duration / 60),
                        seconds: Math.floor(audioEl.duration - Math.floor(audioEl.duration / 60) * 60),
                    }
                    el.currentTimerVal = {
                        minutes: Math.floor(audioEl.currentTime / 60),
                        seconds: Math.floor(audioEl.currentTime - Math.floor(audioEl.currentTime / 60) * 60),
                    }
                    el.totalTimerEl.minutes.innerHTML = el.totalTimerVal.minutes>9?el.totalTimerVal.minutes:'0'+el.totalTimerVal.minutes;
                    el.totalTimerEl.seconds.innerHTML = el.totalTimerVal.seconds>9?el.totalTimerVal.seconds:'0'+el.totalTimerVal.seconds;
                    el.currentTimerEl.minutes.innerHTML = el.currentTimerVal.minutes>9?el.currentTimerVal.minutes:'0'+el.currentTimerVal.minutes;
                    el.currentTimerEl.seconds.innerHTML = el.currentTimerVal.seconds>9?el.currentTimerVal.seconds:'0'+el.currentTimerVal.seconds;
                }
                if(audioEl.readyState === 4){
                    initTimersVal();
                }else{
                    audioEl.onloadedmetadata  = ()=>{
                        initTimersVal();
                    }
                }


            //RANGESLIDER INIT
            noUiSlider.create(el.volumeBarEl, {
                start: [1],
                step: 0.01,
                connect: [true, false],
                range: {
                    'min': [0],
                    'max': [1]
                }
            });

            // BIND EVENTS
            el.volumeBarEl.noUiSlider.on('slide', ()=>{
                const value = parseFloat(el.volumeBarEl.noUiSlider.get());
                el.changeVolume(value);
            })
            audioEl.addEventListener('ended', ()=>{
                audioEl.currentTime = 0;
                audioEl.pause();
                el.playBtnEl.classList.remove('pause');
                el.progressEl.style.width = "0%";
            });
            audioEl.addEventListener('pause', ()=>{
                el.playBtnEl.classList.remove('pause');
            });
            audioEl.addEventListener('play', ()=>{
                el.playBtnEl.classList.add('pause');
            });
            el.playBtnEl.addEventListener('click', ()=>{
                el.play();
            });
            el.downloadBtnEl.addEventListener('click', ()=>{
                el.download();
            });
            el.playerEl.querySelector('.volume-bar').addEventListener('input', (event)=>{
                el.changeVolume(event);
            });
            el.progressBarEl.addEventListener('mousedown', (event)=>{
                el.selectCurrentTime(event);
            });
            el.playerEl.addEventListener('keydown', (event)=>{
                el.handleKeyboard(event);
            });
            // allPlayers.push(el);
            // }
        };
    }
}
Player.init();