import { Dialog } from "@headlessui/react";
import { useState } from "react";

interface SimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    requestId: string;
    channelId: string;
    transactionId: string;
  }) => void;
  data: { requestId: string; channelId: string; transactionId: string };
}

export const SimpleModal: React.FC<SimpleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  data,
}) => {
  const [channelId, setChannelId] = useState(data.channelId);
  const [transactionId, setTransactionId] = useState(data.transactionId);

  const handleSubmit = () => {
    onSubmit({ requestId: data.requestId, channelId, transactionId });
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className="mt-4">
        <label>Request ID</label>
        <input
          type="text"
          value={data.requestId}
          readOnly
          className="w-full p-2 border rounded-md mt-1"
        />
      </div>
      <div className="mt-4">
        <label>Channel ID</label>
        <input
          type="text"
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          required
          className="w-full p-2 border rounded-md mt-1"
        />
      </div>
      <div className="mt-4">
        <label>Transaction ID</label>
        <input
          type="text"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          required
          className="w-full p-2 border rounded-md mt-1"
        />
      </div>
      <div className="mt-6 flex justify-end space-x-2">
        <button onClick={onClose} className="bg-gray-200 p-2 rounded-md">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white p-2 rounded-md"
        >
          Submit
        </button>
      </div>
    </Dialog>
  );
};
