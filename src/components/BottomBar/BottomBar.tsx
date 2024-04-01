"use client";

import React, { useEffect, useState } from "react";
import useStore from "@/components/store/slices";
import Strip from "../Sidebar/Peers/PeerRole/Strip";

// Assets
import { BasicIcons, NestedBasicIcons } from "@/assets/BasicIcons";
import { cn } from "@/components/utils/helpers";
import Dropdown from "../common/Dropdown";
import EmojiTray from "../EmojiTray/EmojiTray";
import { useRouter } from "next/navigation";
import {
  useLocalPeer,
  useLocalAudio,
  usePeerIds,
  useRoom,
  useLocalVideo,
  useLocalScreenShare,
} from "@huddle01/react/hooks";
import toast, { Toaster } from "react-hot-toast";
import { useParams, usePathname } from "next/navigation";
import axios from "axios";
import { GoDotFill } from "react-icons/go";
import { PiLinkSimpleBold } from "react-icons/pi";
import { useNetwork } from "wagmi";

type BottomBarProps = {};

const BottomBar: React.FC<BottomBarProps> = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const params = useParams();
  const meetingCategory = usePathname().split("/")[2];
  const roomId = params.roomId as string | undefined;
  // console.log(roomId);
  console.log("Value: ", meetingCategory);

  const { peerIds } = usePeerIds();

  const { leaveRoom, closeRoom, state } = useRoom();

  const { enableAudio, disableAudio, isAudioOn } = useLocalAudio({
    onProduceStart(producer) {
      toast.success("Producer created");
      console.debug("Producer created", producer);
    },
  });
  const { enableVideo, isVideoOn, stream, disableVideo } = useLocalVideo();
  // const { enableAudio, disableAudio, isAudioOn } = useLocalAudio();
  const { startScreenShare, stopScreenShare, shareStream, videoTrack } =
    useLocalScreenShare();

  const sidebarView = useStore((state) => state.sidebar.sidebarView);

  const isChatOpen = useStore((state) => state.isChatOpen);
  const setIsChatOpen = useStore((state) => state.setIsChatOpen);

  const newMessage = useStore((state) => state.hasNewMessage);
  const setHasNewMessage = useStore((state) => state.setHasNewMessage);

  const setSidebarView = useStore((state) => state.setSidebarView);

  const setPromptView = useStore((state) => state.setPromptView);

  const { role, metadata, updateRole, peerId: localPeerId } = useLocalPeer();

  const [showLeaveDropDown, setShowLeaveDropDown] = useState<boolean>(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { chain } = useNetwork();

  // const handleRecordingButtonClick = async () => {
  //   if (!roomId) {
  //     console.error("roomId is undefined");
  //     return;
  //   }

  //   try {
  //     const status = isRecording
  //       ? await fetch(`/api/stopRecording/${roomId}`)
  //       : await fetch(`/api/startRecording/${roomId}`);

  //     if (!status.ok) {
  //       console.error(`Request failed with status: ${status.status}`);
  //       toast.error(`Failed to ${isRecording ? "stop" : "start"} recording`);
  //       return;
  //     }

  //     setIsRecording(!isRecording);
  //     toast.success(`Recording ${isRecording ? "stopped" : "started"}`);

  //     // If it's a stop recording action, you can fetch the recordings
  //     if (!isRecording) {
  //       const recordingsResponse = await fetch("/api/stopRecording/:roomId");
  //       const recordingsData = await recordingsResponse.json();
  //       console.log("Recordings:", recordingsData);
  //       // Now you can use the recordingsData in your frontend as needed
  //     }
  //   } catch (error) {
  //     console.error(
  //       `Error during ${isRecording ? "stop" : "start"} recording:`,
  //       error
  //     );
  //     toast.error(`Error during ${isRecording ? "stop" : "start"} recording`);
  //   }
  // };

  useEffect(() => {
    if (role === "host") {
      startRecordingAutomatically();
    }
  }, []);

  const startRecordingAutomatically = async () => {
    try {
      // Check if it's the host

      const status = await fetch(`/api/startRecording/${params.roomId}`);
      if (!status.ok) {
        console.error(`Request failed with status: ${status.status}`);
        toast.error("Failed to start recording");
        return;
      }
      setIsRecording(true); // Assuming this should be true after starting recording
      toast.success("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Error starting recording");
    }
  };

  const handleEndCall = async (endMeet: string) => {
    toast("Meeting Ended");
    if (endMeet === "leave") {
      leaveRoom();
    } else if (endMeet === "close") {
      closeRoom();
    } else {
      return;
    }

    // Check if the user is the host
    if (role !== "host") {
      return; // Do not proceed with API calls if not the host
    }

    let meetingType;
    if (meetingCategory === "officehours") {
      meetingType = 2;
    } else if (meetingCategory === "session") {
      meetingType = 1;
    } else {
      meetingType = 0;
    }

    try {
      const response = await fetch(`/api/stopRecording/${roomId}`);
      if (!response.ok) {
        console.error("Failed to fetch recordings data");
        return;
      }
      const recordingsData = await response.json();
      console.log("Recordings:", recordingsData);
      toast.success("Recording stopped");

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: roomId,
          meetingType: meetingType,
          video_uri: recordingsData,
        }),
      };

      const response2 = await fetch("/api/end-call", requestOptions);
      const result = await response2.text();
      console.log(result);
    } catch (error) {
      console.error("Error handling end call:", error);
    }

    try {
      toast.success("Giving Attestations");
      const response = await fetch(`/api/get-attest-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: roomId,
        }),
      });
      const response_data = await response.json();
      console.log("Updated", response_data);
      toast.success("Attestation successful");
    } catch (e) {
      console.log("Error in attestation: ", e);
      toast.error("Attestation denied");
    }

    if (meetingCategory === "officehours") {
      try {
        const response = await fetch(`/api/get-host`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            meetingId: roomId,
          }),
        });
        const response_data = await response.json();
        const host_address = await response_data.address;

        console.log("host address", host_address);

        const res = await fetch(`/api/update-office-hours/${host_address}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const res_data = await res.json();

        // if (res_data.success) {
        console.log("Updated", res_data);
        toast.success("Next Office hour is scheduled!");

        // }
      } catch (e) {
        console.log("error: ", e);
      }
    }
  };

  return (
    <div className="w-full flex items-center px-10 justify-between pb-6 font-poppins">
      {/* Bottom Bar Left */}
      <div>
        {role === "host" ||
        role === "coHost" ||
        role === "speaker" ||
        role === "listener" ? (
          <div className="relative">
            <div
              className="mr-auto flex items-center gap-4 w-44 cursor-pointer"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="bg-blue-shade-200 p-2 rounded-lg">
                <PiLinkSimpleBold
                  className="text-white"
                  size={24}
                ></PiLinkSimpleBold>
              </div>
              <span className="text-gray-800">Quick Links</span>
            </div>
            {isDropdownOpen && chain?.name === "Arbitrum One" && (
              <div className="absolute z-10 top-auto bottom-full left-0 mb-2 w-52 bg-white rounded-lg shadow-lg">
                <div className="arrow-up"></div>
                <a
                  href="https://forum.arbitrum.foundation"
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-200"
                >
                  Forum
                </a>
                <a
                  href="https://arbitrum.io"
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-200"
                >
                  Website
                </a>
                <a
                  href="https://arbitrum.foundation"
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-200"
                >
                  Arbitrum Foundation Website
                </a>
                <a
                  href="https://arbiscan.io"
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-200"
                >
                  Block Explorer
                </a>
                <a
                  href="https://twitter.com/arbitrum"
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-200"
                >
                  Arbitrum Twitter Profile
                </a>
                <a
                  href="https://twitter.com/DAO_Arbitrum"
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-200"
                >
                  Arbitrum DAO Twitter Profile
                </a>
              </div>
            )}
            {isDropdownOpen && chain?.name === "Optimism" && (
              <div className="absolute z-10 top-auto bottom-full left-0 mb-2 w-52 bg-white rounded-lg shadow-lg">
                <div className="arrow-up"></div>
                <a
                  href="https://gov.optimism.io/"
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-200"
                >
                  Forum
                </a>
                <a
                  href="https://optimism.io/"
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-200"
                >
                  Website
                </a>
                <a
                  href="https://optimistic.etherscan.io/"
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-200"
                >
                  Block Explorer
                </a>
                <a
                  href="https://twitter.com/Optimism"
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-200"
                >
                  Optimism Twitter Profile
                </a>
                <a
                  href="https://twitter.com/OptimismGov"
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-200"
                >
                  Optimism DAO Twitter Profile
                </a>
              </div>
            )}
          </div>
        ) : (
          // <OutlineButton
          //   className="mr-auto flex items-center justify-between gap-3"
          //   onClick={() => setPromptView("request-to-speak")}
          // >
          //   {BasicIcons.requestToSpeak}
          //   <div className="text-black ">Request to speak</div>
          // </OutlineButton>
          <></>
        )}
      </div>

      {/* Bottom Bar Center */}
      <div className="flex items-center gap-4">
        {!isAudioOn ? (
          <button
            onClick={() => {
              enableAudio();
            }}
          >
            {NestedBasicIcons.inactive.mic}
          </button>
        ) : (
          <button
            onClick={() => {
              disableAudio();
            }}
          >
            {NestedBasicIcons.active.mic}
          </button>
        )}
        {(role === "host" ||
          ((role === "listener" || role === "speaker") &&
            meetingCategory === "session")) &&
          (!isVideoOn ? (
            <button
              className="rounded-lg inline-flex items-center"
              style={{ backgroundColor: "#0500FF" }}
              onClick={() => {
                enableVideo();
              }}
            >
              {NestedBasicIcons.inactive.video}
            </button>
          ) : (
            <button
              className=" rounded-lg inline-flex items-center"
              style={{ backgroundColor: "#0500FF" }}
              onClick={() => {
                disableVideo();
              }}
            >
              {NestedBasicIcons.active.video}
            </button>
          ))}
        {(role === "host" ||
          ((role === "listener" || role === "speaker") &&
            meetingCategory === "session")) &&
          (!videoTrack ? (
            <button
              className=" rounded-lg inline-flex items-center"
              style={{ backgroundColor: "#0500FF" }}
              onClick={() => {
                startScreenShare();
              }}
            >
              {NestedBasicIcons.inactive.screen}
            </button>
          ) : (
            <button
              className=" rounded-lg inline-flex items-center"
              style={{ backgroundColor: "#0500FF" }}
              onClick={() => {
                stopScreenShare();
              }}
            >
              {NestedBasicIcons.active.screen}
            </button>
          ))}
        {/* <button
          type="button"
          className="text-white bg-blue-700 px-4 py-2 rounded-full"
          onClick={handleRecordingButtonClick}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button> */}
        {/* <button onClick={startRecording}>Start Recording</button>
        <button onClick={stopRecording}>stop Recording</button> */}

        <div className="flex cursor-pointer items-center">
          <Dropdown
            triggerChild={BasicIcons.avatar}
            open={isOpen}
            onOpenChange={() => setIsOpen((prev) => !prev)}
          >
            <EmojiTray
              onClick={() => alert("todo")}
              onClose={() => setIsOpen(false)}
            />
          </Dropdown>
        </div>
        <div className="flex cursor-pointer items-center">
          <Dropdown
            triggerChild={BasicIcons.leave}
            open={showLeaveDropDown}
            onOpenChange={() => setShowLeaveDropDown((prev) => !prev)}
          >
            {role === "host" && (
              <Strip
                type="close"
                title="End spaces for all"
                variant="danger"
                onClick={() => handleEndCall("close")}
              />
            )}
            <Strip
              type="leave"
              title="Leave the spaces"
              variant="danger"
              onClick={() => handleEndCall("leave")}
            />
          </Dropdown>
        </div>

        <div></div>
      </div>
      <div className="flex items-center gap-4">
        {/* Bottom Bar Right */}

        <OutlineButton
          className="ml-auto flex items-center gap-3 border-[#0500FF]"
          onClick={() => {
            setSidebarView(sidebarView === "peers" ? "close" : "peers");
            if (isChatOpen) {
              setIsChatOpen(false);
            }
          }}
        >
          {BasicIcons.peers}
          <span className="text-black">
            {
              Object.keys(peerIds).filter((peerId) => peerId !== localPeerId)
                .length
            }
          </span>
        </OutlineButton>
        <OutlineButton
          className="ml-auto flex items-center gap-3 border-[#0500FF] relative"
          onClick={() => {
            setIsChatOpen(!isChatOpen);
            if (sidebarView !== "close") {
              setSidebarView("close");
            }
          }}
        >
          {BasicIcons.chat}
          {/* <div className="absolute -top-2 -right-3">
            <GoDotFill color="#0500FF" size={25} />
          </div> */}
          {/* {newMessage && (
            <div className="absolute -top-2 -right-3 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center">
              <GoDotFill color="#0500FF" size={25} />
            </div>
          )} */}
        </OutlineButton>
      </div>
      <Toaster
        toastOptions={{
          style: {
            fontSize: "14px",
            backgroundColor: "#3E3D3D",
            color: "#fff",
            boxShadow: "none",
            borderRadius: "50px",
            padding: "3px 5px",
          },
        }}
      />
    </div>
  );
};
export default React.memo(BottomBar);

interface OutlineButtonProps {
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

const OutlineButton: React.FC<OutlineButtonProps> = ({
  className,
  onClick,
  children,
}) => (
  <button
    onClick={onClick}
    type="button"
    className={cn("border border-custom-4 rounded-lg py-2 px-3", className)}
  >
    {children}
  </button>
);
