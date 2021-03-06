import React from 'react';
import {Panel, Form, FormControl, FormGroup, Col, HelpBlock, ControlLabel, Checkbox, Button, FeedBack} from 'react-bootstrap';
import { Link } from 'react-router';
import PropTypes  from 'prop-types';

/* Componente ProfileForm encargado de crear el formulario para el cambio del perfil de un usuario.
Recibirá los siguientes parámetros:
  1) onSubmit: Función llamada al presionar el boton 'submit' del formulario.
  2) onChange: Función encargada de manejar los cambios en los campos de entrada de texto del formulario.
  3) errors: Objeto utilizado para la validación visual del formulario. 
  4) user: Objeto que contendrá el usuario con los nuevos cambios.
*/
const ProfileForm = ({
  onSubmit,
  onChange,
  errors,
  user
}) => (
  <div>
    <div className="row">
      <h2 className="text-center" style={{color:"blue"}}> My profile form </h2>
      <br></br>
    </div>
    <Form horizontal onSubmit={onSubmit}>
      <FormGroup controlId="name" validationState={errors.name=="" ? null : errors.name} >
        <Col componentClass={ControlLabel} sm={2}>
          Name
        </Col>
        <Col sm={10}>
          <FormControl name ="name" placeholder="Name" required="true" onChange={onChange} value={user.name}/>
          <FormControl.Feedback />
        </Col>
      </FormGroup>

      <FormGroup controlId="email" validationState={errors.email=="" ? null : errors.email} >
        <Col componentClass={ControlLabel} sm={2}>
          Email
        </Col>
        <Col sm={10}>
          <FormControl name ="email" type="email" placeholder="Email" required="true" onChange={onChange} value={user.email}/>
          <FormControl.Feedback />
        </Col>
      </FormGroup>

      <FormGroup controlId="new_password" validationState={errors.new_password=="" ? null : errors.new_password}>
        <Col componentClass={ControlLabel} sm={2}>
          New Password
        </Col>
        <Col sm={10}>
          <FormControl name="new_password" type="password" placeholder="New Password" onChange={onChange} value={user.new_password}/>
          <HelpBlock>If this field is empty, password will not change.</HelpBlock>
          <FormControl.Feedback />
        </Col>
      </FormGroup>

      <FormGroup controlId="confir_new_password" validationState={errors.confir_new_password=="" ? null : errors.confir_new_password}>
        <Col componentClass={ControlLabel} sm={2}>
          Confir Password
        </Col>
        <Col sm={10}>
          <FormControl name="confir_new_password" type="password" placeholder="Confir New Password" onChange={onChange} value={user.confir_new_password}/>
          <HelpBlock>For your security, repeat your new password.</HelpBlock>
          <FormControl.Feedback />
        </Col>
      </FormGroup>

      <FormGroup controlId="password" validationState={errors.password=="" ? null : errors.password}>
        <Col componentClass={ControlLabel} sm={2}>
          Current Password
        </Col>
        <Col sm={10}>
          <FormControl name="password" type="password" placeholder="Current Password" required="true" onChange={onChange} value={user.password}/>
          <HelpBlock>For your security, enter your current password</HelpBlock>
          <FormControl.Feedback />
        </Col>
      </FormGroup>

      <FormGroup>
        <Col smOffset={2} sm={10}>
          <Button type="submit">
            Change profile
          </Button>
        </Col>
      </FormGroup>
    </Form> 
  </div>
);

//Haciendo uso de propTypes se comprueban que todos los parámetros son recibidos correctamente
ProfileForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired
};

export default ProfileForm;
