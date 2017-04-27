import React, { Component } from 'react';
import {Pagination} from 'react-bootstrap';
import ListLicenses from '../components/ListLicenses.jsx'
import Auth from '../modules/Auth';
import { Link } from "react-router";
import toastr from 'toastr';
import FileSaver from 'file-saver';

class ListLicensesPage extends Component {
  constructor() {
    super();
    toastr.options={
      "closeButton": true,
      "preventDuplicates": true,
      "newestOnTop": true
    }
    this.state={
    	licenses: [
    	],
      activePage: 1, 
      number_licenses: '',
      orgName: ''
    }
    
    this.expiresFormat=this.expiresFormat.bind(this);
    this.extendFormat=this.extendFormat.bind(this);
    this.downloadFormat=this.downloadFormat.bind(this);
    this.sensorsFormat=this.sensorsFormat.bind(this);
    this.handleSelectPage=this.handleSelectPage.bind(this);
  }

  //Justo antes de renderizar el componente se llama a este método
  componentWillMount(){
    this.state.orgName=this.props.params.orgName;
  	this.loadLicenses(this.state.activePage, this.props.params.id);
  }

  loadLicenses(page, id){
    //Utilizando ajax, en el constructor pedimos la lista de licencias para esa organización
    // create an AJAX request
    const xhr = new XMLHttpRequest();
    xhr.open('get', '/api/organizations/' + id + '/licenses?page=' + page);
    // set the authorization HTTP header
    xhr.setRequestHeader('Authorization', `bearer ${Auth.getToken()}`);
    xhr.responseType = 'json';
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        // success
        // change the component-container state
        this.setState({
          error: "",
          licenses: xhr.response.licenses,
          number_licenses: xhr.response.number_licenses, 
        });

      } else {
        // failure
        {
          xhr.response.message && toastr.error(xhr.response.message)}
        }
    });
    xhr.send();
  }

  sensorsFormat(cell, row){
    const sensores = JSON.parse(JSON.parse(cell));
    let lista = [];

    for(const sensor in sensores){
          lista.push(<li key={sensor}>{sensor}: {sensores[sensor]}</li>);
    }
    return (<div>
        <ul>
        {lista}
        </ul>
    </div>);
  }

  extendFormat(cell, row){
    return (
      <Link to={"/extendLicense/" + cell } 
      className="glyphicon glyphicon-plus" 
      style={{color:"green"}}>
      </Link>
      );
  }

  downloadFormat(cell, row){
      return (<div>
            <Link style={{color:"green"}} 
            onClick={() => {
              const xhr = new XMLHttpRequest();
              xhr.open('GET', "/api/licenses/download?LicenseId=" + cell);
              //Configuramos el token que identifica al usuario que está realizando la petición
              xhr.setRequestHeader('Authorization', `bearer ${Auth.getToken()}`);
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
              xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                  // Si se ha recibido un 200 ok, notificamos con un mensaje que se ha creado correctamente el usuario
                  toastr.success("Download file...");
                  const blob = new Blob([xhr.response], {type: "text/plain;charset=utf-8"});
                  FileSaver.saveAs(blob, cell + ".lib");

                } else if (xhr.status === 404){
                  //Si obtenemos un error 404 es que esa licencia no existe, lo notificamos con un toast de error
                  toastr.error("Error. <br></br> License not found!")
                }else{
                  // En caso de fallo mostramos el mensaje de error recibido del servidor
                  {xhr.response.message && toastr.error(xhr.response.message)}
                }
              });
              xhr.send();
            }}
            className="glyphicon glyphicon-download-alt"></Link> 
         </div>);
  }

  expiresFormat(cell, row){
    const expires_time = new Date(cell);
    const expires_period_days = Math.round((expires_time - new Date())/(24*60*60*1000)); //horas*minutos*segundos*milisegundos de un dia
    if(expires_period_days<0)
      return ( <div style={{'color':"red", 'fontWeight':"bold"}}>¡¡Expires {-expires_period_days} days ago!!</div>)
    else if(expires_period_days<7)
      return ( <div style={{color:"red"}}>{expires_period_days} days remaining</div>)
    else if (expires_period_days<15)
      return ( <div style={{color:"orange"}}>{expires_period_days} days remaining</div>)
    else
      return ( <div style={{color:"blue"}}>{expires_period_days} days remaining</div>)

  }
  //Manejador para seleccionar la pagina a visualizar
  handleSelectPage(eventKey) {
    this.loadLicenses(eventKey, this.props.params.id)
    this.setState({
      activePage: eventKey,
    });
  }


  render(){
    return (
      <div className="container">
        <div>
          <ListLicenses orgName={this.state.orgName} extendFormat={this.extendFormat} downloadFormat={this.downloadFormat} expiresFormat={this.expiresFormat} licenses={this.state.licenses} orgId={this.props.params.id} sensorsFormat={this.sensorsFormat}/>
        </div>
        {
        this.state.number_licenses > 10 ? 
        <div className="text-center">
          <Pagination
            first 
            last 
            next
            prev
            ellipsis
            boundaryLinks
            bsSize="medium"
            items={Math.ceil(this.state.number_licenses/10)} //10 usuarios por página. Redondeamos para arriba
            maxButtons={5}
            activePage={this.state.activePage}
            onSelect={this.handleSelectPage} />
        </div>
        : null
      }
      </div>
        )
  }
}


export default ListLicensesPage;
