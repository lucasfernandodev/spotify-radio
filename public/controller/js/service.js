export default class service{
  constructor({ url }){
    this.url = url
  }

  async makeRequest (data){
    const result = await fetch(this.url, {
      method: "POST",
      body: JSON.stringify(data)
    }) 

    return result.json()
  }
}