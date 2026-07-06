import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

interface Props {
  show: boolean;
  titulo: string;
  mensagem: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  carregando?: boolean;
}

export function ModalConfirmacao({
  show,
  titulo,
  mensagem,
  onConfirmar,
  onCancelar,
  carregando,
}: Props) {
  return (
    <Modal show={show} onHide={onCancelar} centered>
      <Modal.Header closeButton>
        <Modal.Title>{titulo}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{mensagem}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancelar} disabled={carregando}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirmar} disabled={carregando}>
          Confirmar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
