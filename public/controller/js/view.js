export default class View {

  constructor() {
    this.btnStart = document.getElementById('start');
    this.btnStop = document.getElementById('stop');
    this.buttons = () => Array.from(document.querySelectorAll('button'));
    async function onBtnClick() { }
    this.onBtnClick = onBtnClick;
    this.ignoreButtons = new Set(['unassigned']);
    this.DISABLE_BTN_TIMEOUT = 500;
  }


  onLoad() {

    this.changeCommandBtnsVisibility();
    this.btnStart.onclick = this.onStartClicked.bind(this)
  }


  changeCommandBtnsVisibility(hide = true) {
    Array.from(document.querySelectorAll("[name=command]"))
      .forEach(button => {
        const fn = hide === true ? 'add' : 'remove';

        button.classList[fn]('unassigned');
        function onClickReset() { }
        button.onClick = onClickReset;
      })
  }

  configureOnBtnClick(fn) {
    this.onBtnClick = fn
  }

  async onStartClicked({ srcElement: { innerText } }) {
    const btnText = innerText;
    await this.onBtnClick(btnText)
    this.toggleBtnStart();
    this.changeCommandBtnsVisibility(false);

    this.buttons().filter(btn => this.notIsUnassignedButton(btn))
      .forEach(this.setupBtnAction.bind(this))
  }

  notIsUnassignedButton(button) {
    const classes = Array.from(button.classList);

    return !(!!classes.find(item => this.ignoreButtons.has(item)))
  }

  onStopBtn({
    srcElement: {
      innerText
    }
  }) {
    this.toggleBtnStart(false);
    this.changeCommandBtnsVisibility(true);

    return this.onBtnClick(innerText);
  }

  toggleDisableCommandButton(classList) {
    if (!classList.contains('active')) {
      classList.add('active');
      return
    }

    classList.remove('active')
  }


  async onCommandClick(button) {
    const {
      srcElement: {
        classList,
        innerText
      }
    } = button;

    this.toggleDisableCommandButton(classList);
    await this.onBtnClick(innerText);
    setTimeout(() => {
      this.toggleDisableCommandButton(classList);
    }, this.DISABLE_BTN_TIMEOUT)
  }

  setupBtnAction(btn) {
    const text = btn.innerText.toLowerCase();
    if (text.includes('start')) return;
    if (text.includes('stop')) {
      btn.onclick = this.onStopBtn.bind(this);
      return;
    };

    btn.onclick = this.onCommandClick.bind(this)
  }

  toggleBtnStart(active = true) {
    if (active) {
      this.btnStart.classList.add('hidden');
      this.btnStop.classList.remove('hidden');
      return
    }

    this.btnStart.classList.remove('hidden');
    this.btnStop.classList.add('hidden');
  }
}