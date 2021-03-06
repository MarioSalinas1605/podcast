import Layout from '../components/Layout.jsx'
import ChannelGrid from '../components/ChannelGrid.jsx'
import PodcastsList from '../components/PodcastsList.jsx'
import Error from 'next/error'
import PodcastPlayer from '../components/PodcastPlayer.jsx'
import { useState } from 'react'
export async function getServerSideProps({ query, res }) {
    let idChannel = query.id

    try {
        let [reqChannel, reqAudios, reqSeries] = await Promise.all([
            fetch(`https://api.audioboom.com/channels/${idChannel}`),
            fetch(`https://api.audioboom.com/channels/${idChannel}/audio_clips`),
            fetch(`https://api.audioboom.com/channels/${idChannel}/child_channels`)
        ])

        if (reqChannel.status == 404, reqAudios.status == 404, reqSeries.status == 404) {
            res.statusCode = 404
            return { props: { data: { channel: null, audioClips: null, series: null, statusCode: reqChannel.status }}}
        }

        let dataChannel = await reqChannel.json()
        let channel = dataChannel.body.channel

        let dataAudios = await reqAudios.json()
        let audioClips = dataAudios.body.audio_clips

        let dataSeries = await reqSeries.json()
        let series = dataSeries.body.channels

        return { props: { data: { channel, audioClips, series, statusCode: 200 }}}
    } catch (error) {
        return { props: { data: { channel: null, audioClips: null, series: null, statusCode: 503 }}}
    }
}

export default function ({ data }) {
    const [openPodcast, setOpenPodcast] = useState(null)

    const openPodcastHandler = (event, podcast) => {
        event.preventDefault()
        setOpenPodcast(podcast)
    }

    const closePodcastHandler = (event) => {
        event.preventDefault()
        setOpenPodcast(null)
    }

    const { channel, audioClips, series, statusCode } = data

    if (statusCode != 200) {
        return <Error statusCode={statusCode}></Error>
    }

    return (<div>
        <Layout title={channel.title}>
            <div className="banner" style={{ backgroundImage: `url(${channel.urls.banner_image.original})` }} />

            {openPodcast &&
                <div className="modal">
                    <PodcastPlayer clip={openPodcast} onClose={closePodcastHandler} />
                </div>
            }

            <h1>{channel.title}</h1>

            {series.length > 0 &&
                <div>
                    <h2>Series</h2>
                    <ChannelGrid channels={series} />
                </div>
            }

            {
                audioClips.length &&
                <div>
                    <h2>Ultimos Podcasts</h2>
                    <PodcastsList
                        onClickPodcast={(openPodcastHandler)}
                        audioClips={audioClips} />
                </div>
            }
        </Layout>

        <style jsx>{`
            .banner {
                width: 100%;
                padding-bottom: 25%;
                background-position: 50% 50%;
                background-size: cover;
                background-color: #aaa;
            }
            h1 {
                font-weight: 600;
                padding: 15px;
            }
            h2 {
                padding: 5px;
                font-size: 0.9em;
                font-weight: 600;
                margin: 0;
                text-align: center;
            }

            .modal {
                position: fixed;
                top: 0;
                bottom: 0;
                right: 0;
                left: 0;
                z-index: 99999;
            }
        `}</style>
    </div>)
}