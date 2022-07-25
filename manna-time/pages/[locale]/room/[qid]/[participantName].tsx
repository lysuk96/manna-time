import { Center, HStack } from "@chakra-ui/react"
import { Box, Button, Checkbox, CssBaseline, FormControlLabel, FormGroup, Paper, Tab, Tabs, ToggleButton } from "@mui/material"
import axios from "axios"
import { NextPage } from "next"
import { useRouter } from "next/router"
import { useEffect, useRef, useState } from "react"
import CenterFlexLayout from "../../../../components/Layout/CenterFlexLayout"
import ParticipantLogin from "../../../../components/ParticipantLogin"
import Scheduler from "../../../../components/Scheduler/Scheduler"

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import IndeterminateCheckbox from "../../../../components/IndeterminateCheckbox"

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


    let [roomInfo, setRoomInfo] = useState(null)
    let [loader, setLoader] = useState(true)
    let [groupButtonChecked, setGroupButtonChecked] = useState(true)

    //parsed Group Schedule
    let [groupSchedule, setGroupSchedule] = useState(null)
    let [groupNamesExceptMe, setGroupNamesExceptMe] = useState(null)
    let [mySchedule, setMySchedule] = useState(null)
    let [groupFilterChecked, setGroupFilterChecked] = useState(null)
    // console.log(groupFilterChecked)

    let scheduleRef = useRef()

    let srcUrl = process.env.NEXT_PUBLIC_API_URL + '/room/' + qid

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

    const handleTabChange = (event: React.SyntheticEvent, tabValue: number) => {
        setTab(tabValue);
    };

    const copyTextUrl = () => {
        //나중에 링크 바꿀 것
        navigator.clipboard.writeText(process.env.NEXT_PUBLIC_SERVICE_URL + '/ko/entry/' + (qid as string)).then(() => {
            alert("링크가 복사되었습니다")
        })
    }

    const tabLabel = ["그룹 시간", "내 시간", "약속 공유"]

    const tabDescription = (tabIdx: number) => {
        if (tabIdx == 0) {
            return (
                <>
                    <Center>
                        <p className="text-sm font-bold">
                            약속 구성원들의
                            <span className="text-sm font-bold text-blue-700">{" 함께 비는 시간"}</span>
                            입니다
                        </p>
                    </Center >
                </>
            )
        } else if (tabIdx == 1) {
            return (
                <>
                    <Center>
                        <p className="text-sm font-bold">
                            {participantName}님의
                            <span className="text-sm font-bold text-blue-700">{" 비는 시간을 드래그"}</span>
                            해주세요
                        </p>
                    </Center >
                </>
            )
        } else if (tabIdx == 2) {
            return (
                <Center>
                    <p className="text-sm font-bold">
                        약속 방에 관한 정보입니다.
                    </p>
                </Center >
            )
        }
    }

    const tabContainer = (tabIdx: number) => {
        if (tabIdx == 0) {
            return (
                <>
                    <IndeterminateCheckbox
                        participantNames={groupNamesExceptMe}
                        onChange={checked => setGroupFilterChecked(checked)}
                        isChecked={groupFilterChecked}
                    />
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
                    <div className="mb-2">
                        <Button
                            variant="outlined"
                            color="primary"
                            className="md:text-xs text-xs"
                            onClick={() => {
                                window.location.href = `/google/login`;
                            }}
                            startIcon={<CalendarMonthIcon />}
                        >
                            캘린더 연동
                        </Button>
                        <div className="float-right">
                            <FormControlLabel
                                className="md:text-2xs text-xs"
                                sx={{ '& .MuiSvgIcon-root': { fontSize: 18 } }}
                                label={"그룹 시간 보기"}
                                control={<Checkbox
                                    checked={groupButtonChecked}
                                    onChange={(e) => setGroupButtonChecked(e.target.checked)}
                                    defaultChecked={groupButtonChecked}
                                />}
                            />
                        </div>
                    </div>
                </>
            )
        } else if (tabIdx == 2) {
            return (<></>)
        }
    }

    const tabFooterContainer = (tabIdx: number) => {
        if (tabIdx == 0) {
            return (
                <Center>
                    <Button
                            variant="outlined"
                            onClick={() => {
                                setTab(1)
                            }}
                        >내 비는 시간 등록하러 가기</Button>
                </Center>
            )
        } else if (tabIdx == 1) {
            return (
                <>
                    <Center className="mt-3">
                        <Button
                            variant="outlined"
                            onClick={() => {
                                const mySchedule = scheduleRef.current.testFn()
                                submitMySchedule(mySchedule)
                            }}
                        >내 일정 등록하기</Button>
                    </Center>
                </>
            )
        } else if (tabIdx == 2) {
            return (
                <>
                    <Center className="mt-3">
                        <Button
                            variant="outlined"
                            startIcon={<ContentCopyIcon />}
                            onClick={copyTextUrl}
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
            <CenterFlexLayout>
                <Paper sx={{ boxShadow: 4, padding: 3, maxWidth: 693 }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: 2 }}>
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
            })
            .catch((e) => {
                // console.log(e.response)
                alert('일정등록이 실패하였습니다!')
            })

    }
}

export default Room