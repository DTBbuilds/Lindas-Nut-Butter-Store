import React from 'react';
import Modal from 'react-modal';
import LoadingSpinner from '../common/LoadingSpinner';

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '400px',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 1000,
  },
};

Modal.setAppElement('#root');

const PaymentStatusModal = ({ isOpen, status, error, onRetry, onClose }) => {
  const renderContent = () => {
    switch (status) {
      case 'initiating':
        return (
          <>
            <h2 className="text-xl font-semibold mb-4">Processing Payment...</h2>
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">Please wait while we initiate the M-Pesa payment.</p>
          </>
        );
      case 'initiated':
        return (
          <>
            <h2 className="text-xl font-semibold mb-4 text-blue-600">Action Required</h2>
            <p className="text-gray-700">An M-Pesa STK push has been sent to your phone. Please enter your PIN to complete the payment.</p>
            <div className="mt-6">
              <LoadingSpinner />
              <p className="text-sm text-gray-500 mt-2">Waiting for confirmation...</p>
            </div>
          </>
        );
      case 'failed':
        return (
          <>
            <h2 className="text-xl font-semibold mb-4 text-red-600">Payment Failed</h2>
            <p className="text-gray-700 mb-6">{error || 'An unknown error occurred.'}</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
              >
                Close
              </button>
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                Retry Payment
              </button>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={customStyles}
      contentLabel="Payment Status"
      shouldCloseOnOverlayClick={status !== 'initiated' && status !== 'initiating'}
    >
      {renderContent()}
    </Modal>
  );
};

export default PaymentStatusModal;
