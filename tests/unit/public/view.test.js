import {jest, expect, describe, test, beforeEach} from "@jest/globals";
import {JSDOM} from 'jsdom';
import View from "../../../public/controller/js/view.js";

describe("#View ~ Test suit for presentation layer", () => {

  const dom = new JSDOM;

  global.document = dom.window.document;
  global.window = dom.window;

  function makeClassListElement({
    classes
  } = {
    classes: []
  }) {
    const classList = new Set(classes)
    classList.contains = classList.has
    classList.remove = classList.delete

    return classList
  }

  function makeBtnElement({
    text,
    classList,

  } = {
    text : '',
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    }
  }){
    return {
      onClick: jest.fn(),
      classList,
      innerText: text
    }
  }

  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();

    jest.spyOn(
      document,
      'getElementById'
    ).mockReturnValue(makeBtnElement());
  })

  test('#changeCommandBtnsVisibility ~ given hide=true it should add unassigned class and reset onClick', async () => {

    const view = new View;

    const btn = makeBtnElement();
    jest.spyOn(
      document,
      'querySelectorAll'
    ).mockReturnValue([btn]);

    view.changeCommandBtnsVisibility();

    expect(btn.classList.add).toHaveBeenCalledWith('unassigned')
    expect(btn.onClick.name).toStrictEqual('onClickReset');

    expect(() => btn.onClick()).not.toThrow();


  });

  test('#changeCommandBtnsVisibility ~ given hide=false it should remove unassigned class and reset onClick', async () => {
    const view = new View;

    const btn = makeBtnElement();
    jest.spyOn(
      document,
      'querySelectorAll'
    ).mockReturnValue([btn]);

    view.changeCommandBtnsVisibility(false);

    expect(btn.classList.add).not.toHaveBeenCalled()
    expect(btn.classList.remove).toHaveBeenCalledWith('unassigned')
    expect(btn.onClick.name).toStrictEqual('onClickReset');

    expect(() => btn.onClick()).not.toThrow();  // test
  });
  
  test('#onLoad', async () => {
    const view = new View();

    jest.spyOn(
      view,
      view.changeCommandBtnsVisibility.name
    ).mockReturnValue();

    view.onLoad();

    expect(view.changeCommandBtnsVisibility).toHaveBeenCalled();
  });

  test('#onStartClicked', async() => {
    const view = new View();

    jest.spyOn(
      view,
      view.changeCommandBtnsVisibility.name
    ).mockReturnValue()

    jest.spyOn(
      view,
      view.toggleBtnStart.name
    ).mockReturnValue()

    jest.spyOn(
      view,
      view.onBtnClick.name
    ).mockReturnValue()

    jest.spyOn(
      view,
     'changeCommandBtnsVisibility'
    ).mockReturnValue()

    jest.spyOn(
      view,
      view.notIsUnassignedButton.name
    ).mockReturnValue(true)

    jest.spyOn(
      view,
      view.setupBtnAction.name
    ).mockReturnValue()

    const text = 'start';

    const btn = makeBtnElement({
      text
    })

    jest.spyOn(
      document,
      'querySelectorAll'
    ).mockReturnValueOnce([btn])

    const eventOnClick = {
      srcElement: btn
    }

    await view.onStartClicked(eventOnClick);

    expect(view.toggleBtnStart).toHaveBeenCalled();
    expect(view.onBtnClick).toHaveBeenCalledWith(text);
    expect(view.changeCommandBtnsVisibility).toHaveBeenCalledWith(false);
    expect(view.notIsUnassignedButton).toHaveBeenNthCalledWith(1, btn);

    const [calls] = view.setupBtnAction.mock.calls[0];
    expect(view.setupBtnAction).toHaveBeenCalledTimes(1);
    expect(calls).toStrictEqual(btn);
  })

  test('#setupBtnAction ~ given start command it should not run ', async () => {
    
    const view = new View();

    const btn = makeBtnElement({
      text: "start"
    })

    view.setupBtnAction(btn);

    const result = btn.onClick();
    const expected = jest.fn()();

    expect(result).toStrictEqual(expected)

  })

  test('#setupBtnAction ~ given stop command it should onStop onclick ', async () => {

    const view = new View();

    jest.spyOn(
      view,
      view.onStopBtn.name
    ).mockReturnValue()

    const btn = makeBtnElement({
      text: "stop"
    })

    view.setupBtnAction(btn);

    expect(btn.onclick.name).toStrictEqual(view.onStopBtn.bind(view).name)
  });

  test('#setupBtnAction ~ given other command it should setup onCommandClick onClick', () => {
    const view = new View();

    jest.spyOn(
      view,
      view.onCommandClick.name
    ).mockReturnValue();

    const btn = makeBtnElement({
      text : "applause" 
    })

    view.setupBtnAction(btn);

    expect(btn.onclick.name).toStrictEqual(view.onCommandClick.bind(view).name)
  })

  test('#onCommandClick', async () => {
    
    const view = new View();

    const text = 'myText';

    const onClickElement = {
      srcElement: makeBtnElement({
        text
      })
    }

    jest.spyOn(
      view,
      view.toggleDisableCommandButton.name
    ).mockReturnValue()

    jest.spyOn(
      view,
      view.onBtnClick.name
    ).mockResolvedValue()

    jest.useFakeTimers() // ets

    await view.onCommandClick(onClickElement);
    jest.advanceTimersByTime(view.DISABLE_BTN_TIMEOUT);

    expect(view.toggleDisableCommandButton).toHaveBeenNthCalledWith(1, onClickElement.srcElement.classList)
    expect(view.toggleDisableCommandButton).toHaveBeenNthCalledWith(2, onClickElement.srcElement.classList)
    expect(view.onBtnClick).toHaveBeenCalledWith(text)

  })

  test('#toggleDisabledCommandBtn ~ active=true should add hidden class', () => {
    const classListWithoutActiveClass = makeClassListElement();

    const view = new View();

    view.toggleDisableCommandButton(classListWithoutActiveClass);
    expect(classListWithoutActiveClass.size).toStrictEqual(1);
    expect([...classListWithoutActiveClass.values()]).toStrictEqual(['active']);

  })

  test('#toggleDisabledCommandBtn ~ active=false should remove hidden class', () => {
    const cssClass = 'active';
    const classListWithActiveClass = makeClassListElement({
      classes: [cssClass]
    })

    const view = new View();

    view.toggleDisableCommandButton(classListWithActiveClass);
    expect(classListWithActiveClass.size).toBeFalsy();
    expect(classListWithActiveClass.has(cssClass)).toBeFalsy();
  })

  test('onStopBtn', async () => {
    const view = new View();

    jest.spyOn(
      view,
      view.toggleBtnStart.name
    ).mockReturnValue();

    jest.spyOn(
      view,
      view.changeCommandBtnsVisibility.name
    ).mockReturnValue();

    jest.spyOn(
      view,
      view.onBtnClick.name
    ).mockResolvedValue();

    const text = 'myBtn';
    const onClickElement = {
      srcElement: makeBtnElement({
        text
      })
    }

    await view.onStopBtn(onClickElement);

    expect(view.toggleBtnStart).toHaveBeenCalledWith(false);
    expect(view.changeCommandBtnsVisibility).toHaveBeenCalledWith(true);
    expect(view.onBtnClick).toHaveBeenCalledWith(text);


  });


  test('#toggleBtnStart ~ given active= true it should add the "hidden" class from btnStart and "remove" Hidden to btnStop', () => {
    const cssClass = 'hidden';

    const btnStart = makeBtnElement({
      classList: makeClassListElement()
    })

    const btnStop = makeBtnElement({
      classList: makeClassListElement({
        classes: [cssClass]
      })
    })

    const view = new View();
    view.btnStart = btnStart;
    view.btnStop = btnStop;

    view.toggleBtnStart(); //

    expect(btnStart.classList.has(cssClass)).toBeTruthy()
    expect(btnStop.classList.has(cssClass)).toBeFalsy()

  })

  test('#toggleBtnStart ~ given active=false it should remove the hidden class from btnStart and add Hidden to btnStop', () => {
    const cssClass = 'hidden';

    const btnStart = makeBtnElement({
      classList: makeClassListElement({
        classes: [cssClass]
      })
    })

    const btnStop = makeBtnElement({
      classList: makeClassListElement()
    })

    const view = new View();
    view.btnStart = btnStart;
    view.btnStop = btnStop;

    view.toggleBtnStart(false);

    expect(btnStop.classList.has(cssClass)).toBeTruthy()
    expect(btnStart.classList.has(cssClass)).toBeFalsy()

  })

  test('#btnIsActive ~ Should not be unassigned if nome of the classes are part of ignoreButtons prop', () => {
    const view = new View();

    const cssUnassignedButton = [...view.ignoreButtons.values()];

    const btnStart = makeBtnElement({
      classList: makeClassListElement({
        classes: cssUnassignedButton
      })
    })

    const result = view.notIsUnassignedButton(btnStart);
    expect(result).toBeFalsy() // test
  })

  test('#btnIsActive ~ Should not be unassigned if nome of the classes are part of ignoreButtons prop', () => {
    const view = new View();

    const cssClassToIgnoreButton = ['abc'];
    const btnStart = makeBtnElement({
      classList: makeClassListElement({
        classes: cssClassToIgnoreButton
      })
    })

    const result = view.notIsUnassignedButton(btnStart);
    expect(result).toBeTruthy()
  })

  test('#configureOnBtnClick', () => {
    const view = new View();
    const fn = jest.fn();

    view.configureOnBtnClick(fn);
    expect(view.onBtnClick).toStrictEqual(fn);
  })

  test('#View.constructor', () => {
    const view = new View();
    const d = document.getElementById();

    expect(view.btnStart).toStrictEqual(d)
    expect(view.btnStop).toStrictEqual(d)
    expect(view.ignoreButtons).toBeInstanceOf(Set);
    expect(view.buttons).toBeInstanceOf(Function);
    expect(view.onBtnClick).toBeInstanceOf(Function);
    expect(view.DISABLE_BTN_TIMEOUT).toStrictEqual(500);

    expect(() => view.onBtnClick()).not.toThrow()
  })
})