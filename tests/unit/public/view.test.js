import {jest, expect, describe, test, beforeEach} from "@jest/globals";
import {JSDOM} from 'jsdom';
import View from "../../../public/controller/js/view.js";

describe("#View ~ Test suit for presentation layer", () => {

  const dom = new JSDOM;

  global.document = dom.window.document;
  global.window = dom.window;

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
      onclick: jest.fn(),
      classList,
      innerText: text
    }
  }

  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();

    jest.spyOn(
      document,
      document.getElementById.name
    ).mockReturnValue(makeBtnElement())
  })

  test('#changeCommandBtnsVisibility ~ given hide=true it should add unassigned class and reset onClick', async () => {

    const view = new View;

    const btn = makeBtnElement();
    jest.spyOn(
      document,
      document.querySelectorAll.name
    ).mockReturnValue([btn]);

    view.changeCommandBtnsVisibility();

    expect(btn.classList.add).toHaveBeenCalledWith('unassigned')

  });

  test.todo('#changeCommandBtnsVisibility ~ given hide=false it should remove unassigned class and reset onClick');
  test.todo('#onLoad');


})