import axios from "axios";
import { ReleaseAsset } from "../common/ReleaseAsset";

const feed =
    "https://api.github.com/repos/ZoopakaClub/AmongUs-Mod-Launcher/releases";

const getReleaseForUpdate = async (): string => {
    let result = "";
    try {
        const response_release = await axios.get(feed);
        if (response_release.status !== 200) throw new Error("not found");
        

        const regex = new RegExp(/RELEASES/);
        let tag_name = "";
        for (const key in response_release.data) {
            const release = response_release.data[key];
            for (const i in release["assets"]) {
                const asset = release["assets"][i];
                if (!asset.name.match(regex)) continue;
                tag_name = release.tag_name;
            }
            if (tag_name) break;
        }
        if (tag_name) {
            result =
                `https://github.com/ZoopakaClub/AmongUs-Mod-Launcher/releases/download/${tag_name}`;
        }
    } catch (error) {
        console.error(error)
    }
    return result;
};

export default getReleaseForUpdate;
