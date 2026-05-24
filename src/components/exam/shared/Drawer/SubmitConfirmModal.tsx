import React from 'react'
import Modal from '../../../Modal'
import { translate } from '../../../../utils/translation'

interface SubmitConfirmModalProps {
  onConfirm: () => void
  onClose: () => void
}

const SubmitConfirmModal: React.FC<SubmitConfirmModalProps> = ({ onConfirm, onClose }) => {
  return (
    <Modal
      variant="danger"
      title={translate('confirm.submit.title')}
      message={translate('confirm.submit.message')}
      buttons={[translate('confirm.submit.button0'), translate('confirm.submit.button1')]}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  )
}

export default SubmitConfirmModal
