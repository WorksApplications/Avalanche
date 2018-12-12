/*
 * Copyright (c) 2018 Works Applications Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
declare const COLLECT_API_BASE: string;
declare const BLAME_API_BASE: string;
declare const FLAMESCOPE_API_BASE: string;
declare const APP_NAME: string;

const _COLLECT_API_BASE = COLLECT_API_BASE;
const _BLAME_API_BASE = BLAME_API_BASE;
const _FLAMESCOPE_API_BASE = FLAMESCOPE_API_BASE;
const _APP_NAME = APP_NAME;
export {
  _COLLECT_API_BASE as COLLECT_API_BASE,
  _BLAME_API_BASE as BLAME_API_BASE,
  _FLAMESCOPE_API_BASE as FLAMESCOPE_API_BASE,
  _APP_NAME as APP_NAME
};
