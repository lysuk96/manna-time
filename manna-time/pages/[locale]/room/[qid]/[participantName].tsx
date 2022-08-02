import { Center, HStack } from "@chakra-ui/react"
import { Box, Button, Checkbox, CssBaseline, FormControlLabel, FormGroup, Paper, Tab, Tabs, ToggleButton } from "@mui/material"
import axios from "axios"
import { NextPage } from "next"
import { useRouter } from "next/router"
import { useEffect, useRef, useState } from "react"
import CenterFlexLayout from "../../../../components/Layout/CenterFlexLayout"
import ParticipantLogin from "../../../../components/Molecule/ParticipantLogin/ParticipantLogin"
import Scheduler from "@/components/Molecule/Scheduler/Scheduler"

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import InfoIcon from '@mui/icons-material/Info';

import IndeterminateCheckbox from "../../../../components/IndeterminateCheckbox"
import { MixpanelTracking } from "@/utils/mixpanel"
import { DateObject } from "react-multi-date-picker"
import { start } from "repl"

import SendIcon from '@mui/icons-material/Send';
import { useRecoilState } from "recoil"
import { FeedbackState } from "@/src/state";
import Feedback from "@/components/Molecule/Feedback/Feedback"

import PublishIcon from '@mui/icons-material/Publish';

const getParsedGroup = (data: object[], myName: string) => {
    let namesExceptMe: string[] = []

    let schedulesExceptMe: object[] = []
    let mySchedule: object = {}

    data.forEach(obj => {
        if (obj.participantName != myName) {
            schedulesExceptMe.push(obj)
        } else { mySchedule = obj }
    })

    schedulesExceptMe.forEach(obj => namesExceptMe.push(obj.participantName))
    return (
        {
            namesExceptMe: namesExceptMe,
            schedulesExceptMe: schedulesExceptMe,
            mySchedule: mySchedule
        }
    )
}

const Room: NextPage = function () {
    const [tab, setTab] = useState(0); // 0: 내 스케줄 , 1: 그룹 스케줄

    const router = useRouter()
    const { qid, participantName } = router.query

    const [isFeedbackShown, setIsFeedbackShown] = useRecoilState(FeedbackState)

    let [roomInfo, setRoomInfo] = useState(null)
    let [loader, setLoader] = useState(true)
    let [groupButtonChecked, setGroupButtonChecked] = useState(true)

    //parsed Group Schedule
    let [groupSchedule, setGroupSchedule] = useState(null)
    let [groupNamesExceptMe, setGroupNamesExceptMe] = useState(null)
    let [mySchedule, setMySchedule] = useState(null)
    let [groupFilterChecked, setGroupFilterChecked] = useState(null)

    let scheduleRef = useRef()

    const srcUrl = process.env.NEXT_PUBLIC_API_URL + '/room/' + qid
    const googleLoginUrl = `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?access_type=offline&scope=profile%20email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar&response_type=code&redirect_uri=${process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI}&client_id=1089339257767-8rqr5aicc05veuh76584pbf3el7cqvhk.apps.googleusercontent.com`

    // 방 정보 가져오기 -> 추후에 props로 최적화할 것!
    useEffect(() => {
        axios.get(srcUrl)
            .then((result) => {
                setRoomInfo(result.data);
                if (result.data?.title !== undefined) { setLoader(false); };
            })
    }, [srcUrl]);

    // 전체 스케줄 가져오기
    useEffect(() => {
        axios.get(srcUrl + '/group')
            .then((result) => {
                let parsedGroup = getParsedGroup(result.data, participantName)

                setGroupSchedule(parsedGroup.schedulesExceptMe);
                setGroupNamesExceptMe(parsedGroup.namesExceptMe)
                setMySchedule(parsedGroup.mySchedule)
                setGroupFilterChecked(Array(parsedGroup.namesExceptMe.length).fill(true))
            })
    }, [srcUrl]);

    //구글 캘린더 등록
    useEffect(() => {
        //SSR이기 때문에 window객체가 undefined로 설정. -> DOM 형성 후 실행이 되는 useEffect 사용해야 함
        window.addEventListener("message", (event) => {
            sendCalendarRequest(event.data, qid)
        }, false)
    }, [])

    const handleTabChange = (event: React.SyntheticEvent, tabValue: number) => {
        setTab(tabValue);
    };

    const copyTextUrl = () => {
        //나중에 링크 바꿀 것
        navigator.clipboard.writeText(process.env.NEXT_PUBLIC_SERVICE_URL + '/ko/entry/' + (qid as string)).then(() => {
            alert("링크가 복사되었습니다. 약속 구성원에게 공유하세요.")
        })
    }

    const tabLabel = ["그룹 시간", "내 시간", "약속 공유"]

    const tabDescription = (tabIdx: number) => {
        if (tabIdx == 0) {
            return (
                <>
                    <Center>
                        <p className="md:text-xl text-md font-bold ml-4 mr-4">
                            참여자들의
                            <span className="md:text-xl text-md font-bold text-blue-700">{" 약속 가능한 시간"}</span>
                            입니다
                        </p>
                    </Center >
                </>
            )
        } else if (tabIdx == 1) {
            return (
                <>
                    <Center className="ml-4 mr-4">
                        <p className="md:text-xl text-md font-bold ">
                            {participantName}님,<br/>
                        </p>
                    </Center >
                    <Center className="mb-3 ml-4 mr-4">
                        <p className="md:text-xl text-md font-bold ">
                            <span className="md:text-xl text-md font-bold text-blue-700">{" 약속 가능 시간을 드래그"}</span>
                            해주세요
                        </p>
                    </Center >
                </>
            )
        } else if (tabIdx == 2) {
            return (
                <Center className="ml-4 mr-4">
                    <InfoIcon className="text-blue-700 mr-1" />
                    <p className="md:text-xl text-lg font-bold">
                        <span className="md:text-xl text-lg font-bold text-blue-700">약속 방 정보</span>
                    </p>
                </Center >
            )
        }
    }

    const tabContainer = (tabIdx: number) => {
        if (tabIdx == 0) {
            return (
                <>
                    <div className="ml-5 mr-5">
                        <IndeterminateCheckbox
                            participantNames={groupNamesExceptMe}
                            onChange={checked => setGroupFilterChecked(checked)}
                            isChecked={groupFilterChecked}
                        />
                    </div>
                    {/* {(
                        groupFilterChecked
                        ?
                        :
                        <h1>그룹원 정보를 불러오는 중입니다..</h1>
                    )} */}
                </>
            )
        } else if (tabIdx == 1) {
            return (
                <>
                    <div className="mb-2 ml-5 mr-5">
                        {/* <Button
                            variant="outlined"
                            color="primary"
                            className="md:text-xs text-xs"
                            onClick={() => {
                                window.open(googleLoginUrl,"self",'popup')
                            }}
                            startIcon={<CalendarMonthIcon />}
                        >
                            캘린더 연동
                        </Button> */}
                        {/* <div className="float-right"> */}
                            <FormControlLabel
                                className="md:text-2xs text-xs"
                                sx={{ '& .MuiSvgIcon-root': { fontSize: 18 } }}
                                label={"그룹 시간 보기"}
                                control={<Checkbox
                                    checked={groupButtonChecked}
                                    onChange={(e) => setGroupButtonChecked(e.target.checked)}
                                    defaultChecked={groupButtonChecked}
                                />
                                }
                        />
                        <Button
                            size="small"
                            className="float-right"
                            startIcon={<PublishIcon/>}
                            variant="contained"
                            onClick={() => {
                                const mySchedule = scheduleRef.current.testFn()
                                submitMySchedule(mySchedule)
                                MixpanelTracking.getInstance().buttonClicked("내 일정 등록")
                            }}
                        >제출하기</Button>
                        {/* </div> */}
                    </div>
                </>
            )
        } else if (tabIdx == 2) {
            let title, startDate, endDate;
            if (roomInfo != undefined) {
                if (roomInfo.title != undefined)
                    title = roomInfo.title
                if (roomInfo.dates != undefined) {
                    startDate = (roomInfo.dates[0] as string).substring(5).replace('-', '/')
                    endDate = (roomInfo.dates[roomInfo.dates.length - 1]).substring(5).replace('-', '/')
                }

            }

            return (<>
                <div className="m-5 space-y-2">
                    <p className="md:text-lg text-md font-bold">
                        <span className="md:text-xl text-lg font-bold text-blue-700">방 이름 : </span>
                        {title ? title : "loading..."}
                    </p>
                    <p className="md:text-lg text-md font-bold">
                        <span className="md:text-xl text-lg font-bold text-blue-700">기간 : </span>
                        {startDate && endDate ? `${startDate} ~ ${endDate}` : "loading"}
                    </p>
                </div>
                <Center width="100">
                </Center >
            </>)
        }
    }

    const tabFooterContainer = (tabIdx: number) => {
        if (tabIdx == 0) {
            return (
                <Center>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setTab(1)
                            MixpanelTracking.getInstance().buttonClicked("내시간 등록")
                        }}
                    >내 시간 등록하러 가기</Button>
                </Center>
            )
        } else if (tabIdx == 1) {
            return (
                <>
                </>
            )
        } else if (tabIdx == 2) {
            return (
                <>
                    <Center className="ml-4 mr-4">
                    </Center>
                    <Center className="mb-3 space-x-3 ml-4 mr-4">
                        <Button
                            startIcon={<SendIcon />}
                            fullWidth
                            variant="outlined"
                            onClick={() => {
                                setIsFeedbackShown(true)
                            }}
                        >
                            관리자에게 문의하기
                        </Button>
                    </Center>
                    <Center>
                        <Button
                            fullWidth
                            className="ml-4 mr-4"
                            variant="contained"
                            startIcon={<ContentCopyIcon />}
                            onClick={() => {
                                copyTextUrl()
                                MixpanelTracking.getInstance().buttonClicked("링크 복사")
                            }}
                        >
                            방 링크 복사
                        </Button>
                    </Center>
                </>
            )
        }
    }


    return (
        <>
            {isFeedbackShown && <Feedback/>}
            <CenterFlexLayout>
                <Paper sx={{ boxShadow: 4, paddingBottom: 2, maxWidth: 693, borderRadius: 3 }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', margin: 2 }}>
                        <Tabs value={tab} onChange={handleTabChange} aria-label="basic tabs example">
                            <Tab label={tabLabel[0]} />
                            <Tab label={tabLabel[1]} />
                            <Tab label={tabLabel[2]} />
                        </Tabs>
                    </Box>
                    {tabDescription(tab)}
                    {tabContainer(tab)}
                    {(
                        loader ? <h1>방 정보를 불러오는 중입니다</h1> :
                            groupSchedule !== null && tab != 2
                                ?
                                <div className="mb-3">
                                    <Scheduler
                                        // roomInfo={props.roomInfo}
                                        isDisabled={tab == 1 ? false : true}
                                        ref={scheduleRef}
                                        groupSchedule={groupSchedule}
                                        roomInfo={roomInfo}
                                        isGroup={(tab == 0) || groupButtonChecked ? true : false}
                                        mySchedule={mySchedule}
                                        groupFilterChecked={groupFilterChecked}
                                    />
                                </div>
                                :
                                null
                    )}
                    {tabFooterContainer(tab)}
                </Paper>
            </CenterFlexLayout>
        </>
    )

    function submitMySchedule(props) {
        // console.log(props)
        axios({
            method: 'post',
            url: srcUrl + '/participant/available',
            data: {
                "participantName": participantName,
                "available": props
            }
        })
            .then((result) => {
                alert('일정이 등록되었습니다.')
                router.push(`/${router.query.locale}/entry/${qid}/`);

            })
            .catch((e) => {
                // console.log(e.response)
                alert('일정등록이 실패하였습니다!')
            })

    }

    function sendCalendarRequest(authCode: string, roomUuid: string) {
        console.log(roomUuid)
        // const requestUrl = `${process.env.NEXT_PUBLIC_API_URL}/room/${roomUuid}`
        const requestUrl = srcUrl + `/participant/google?code=${authCode}`
        axios({
            method: 'get',
            url: requestUrl
        })
            .then((result) => {
                console.log(result)

            })
            .catch((e) => {
                console.log(e.response)
                alert('캘린더 불러오기 실패')
            })
    }
}

export default Room