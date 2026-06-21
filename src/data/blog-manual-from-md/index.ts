import type { BlogPost } from "@/types";

import { argentina_2_nedeli_marshrutPost } from "./argentina-2-nedeli-marshrut";
import { argentina_10_dnej_3_nedeliPost } from "./argentina-10-dnej-3-nedeli";
import { ruta_40_sem_ozerPost } from "./ruta-40-sem-ozer";
import { vnutrennie_aviabilety_argentinaPost } from "./vnutrennie-aviabilety-argentina";
import { kak_dobratsya_v_argentinuPost } from "./kak-dobratsya-v-argentinu";
import { byudzhet_poezdki_argentinaPost } from "./byudzhet-poezdki-argentina";
import { stoimost_zhizni_buenos_airesPost } from "./stoimost-zhizni-buenos-aires";
import { kak_menyat_dengi_argentinaPost } from "./kak-menyat-dengi-argentina";
import { buenos_aires_rajonyPost } from "./buenos-aires-rajony";
import { mendoza_vinnyj_gidPost } from "./mendoza-vinnyj-gid";
import { vnzh_argentina_rezidenciyaPost } from "./vnzh-argentina-rezidenciya";
import { viza_cifrovogo_kochevnika_argentinaPost } from "./viza-cifrovogo-kochevnika-argentina";
import { dni_cuil_argentinaPost } from "./dni-cuil-argentina";
import { grazhdanstvo_argentinyPost } from "./grazhdanstvo-argentiny";
import { bankovskij_schet_argentinaPost } from "./bankovskij-schet-argentina";

export const REPLACED_MANUAL_SLUGS = new Set<string>([
  "buenos-aires-neighborhoods",
  "mendoza-wine-route",
]);

export const manualPostsFromMd: BlogPost[] = [
  argentina_2_nedeli_marshrutPost,
  argentina_10_dnej_3_nedeliPost,
  ruta_40_sem_ozerPost,
  vnutrennie_aviabilety_argentinaPost,
  kak_dobratsya_v_argentinuPost,
  byudzhet_poezdki_argentinaPost,
  stoimost_zhizni_buenos_airesPost,
  kak_menyat_dengi_argentinaPost,
  buenos_aires_rajonyPost,
  mendoza_vinnyj_gidPost,
  vnzh_argentina_rezidenciyaPost,
  viza_cifrovogo_kochevnika_argentinaPost,
  dni_cuil_argentinaPost,
  grazhdanstvo_argentinyPost,
  bankovskij_schet_argentinaPost,
];
