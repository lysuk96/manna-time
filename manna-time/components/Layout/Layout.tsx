import { Flex } from "@chakra-ui/react"
import { useTranslation } from "next-i18next"
import { useRouter } from "next/router"
import { Props } from "next/script"
import Header from "./Header"
import Navbar from "./Navbar"

function Layout({children}:Props) {
    const router = useRouter()
    const match = router.asPath.match(/[^/?]*[^/?]/g)
    const pageName = match![1]

    const { t } = useTranslation(['common'])

    return (
        <>
            <Header title={t(pageName)} service={t('service')} />
            <Navbar/>
            <Flex paddingTop={"5rem"}>{children}</Flex>
        </>
    )
}

export default Layout