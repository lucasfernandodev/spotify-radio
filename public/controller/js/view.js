export default class View{
  onLoad(){
    this.changeCommandBtnsVisibility();
  }


  changeCommandBtnsVisibility(hide = true){
    Array.from(document.querySelectorAll("[name=command]"))
    .forEach(button => {
      const fn = hide === true ? 'add' : 'remove';

      button.classList[fn]('unassigned');
      function onClickReset(){}
      button.onClick = onClickReset;
    })
  }
}