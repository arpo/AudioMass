/**
 * return array of objects with intervals between peaks
 * @param peaks array with peaks data from song
 */

 const getIntervals = peaks => {
  const intervals = [];
  peaks.forEach((peak, index) => {
    for (let i = 1; i < 10; i++) {
      const newInterval = peaks[index + i] - peak;

      let foundInterval = intervals.some(interval => {
        // Doing +/- to make the gap bigger for it to hit, for acoustic music.
        if (interval.interval < newInterval - 0 && interval.interval > newInterval + 0) {
          return (interval.count += 1);
        }
      });

      if (!foundInterval) {
        intervals.push({
          interval: newInterval,
          count: 1,
        });
      }
    }
  });
  return intervals;
};

/**
 * Translate interval data to beats per minute
 * @param intervals an array of intervals
 * @param sampleRate the sample rate of the song, samples per second (kHz)
 */

 const getTempos = (intervals, sampleRate) => {
  let tempoCounts = [];

  intervals.forEach(interval => {
    if (interval !== 0 || !interval.isNaN()) {
      // translate intervals to BPM
      let theoreticalTempo = 60 / (interval.interval / sampleRate);

      // Getting bpm with in range
      while (theoreticalTempo < 90) theoreticalTempo *= 2;
      while (theoreticalTempo > 180) theoreticalTempo /= 2;

      theoreticalTempo = Math.round(theoreticalTempo);

      /**
       * Check if BPM been found before and add them together.
       */

      let foundTempo = tempoCounts.some(tempoCount => {
        if (tempoCount.tempo === theoreticalTempo) {
          return (tempoCount.count += interval.count);
        }
      });

      /**
       * Add a unique tempo to the collection
       */

      if (!foundTempo) {
        tempoCounts.push({
          tempo: theoreticalTempo,
          count: interval.count,
        });
      }
    }
  });

  return tempoCounts.sort((a, b) => b.count - a.count);
};

/**
 * Returns array of values that exceeds the threshold
 * @param buffer array of song data
 * @param threshold threshold value
 */

 const getPeaksAtThreshold = (buffer, threshold) => {
  const peaks = [];

  for (let i = 0; i < buffer.length; ) {
    if (buffer[i] > threshold) {
      peaks.push(i);

      // skip 1/44 of song to leave current peak
      i += 1000;
    }
    i++;
  }
  return peaks;
};

/**
 * Return array of peaks of the highest amplitude
 * @param buffer array of peaks
 */
const getPeaks = async buffer => {
  let threshold = 2;

  const minThreshold = 0.3;
  let peaks = [];
  const minPeaks = 15;

  /**
   * Lowering the threshold value until enough peaks found
   */
  while (peaks.length < 15 && threshold > minThreshold) {
    peaks = getPeaksAtThreshold(buffer, threshold);
    threshold -= 0.05;
  }

  /**
   * Error if not enough peaks are found
   */
  if (peaks.length < minPeaks) {
    throw new Error('Could not find enough samples for a reliable detection.');
  }
  return peaks;
};

/**
 * Return an array with peaks after audio source ran through filters
 * @param buffer the decode audio data from context
 * @param lowPass the highest frequenzy for the filter
 * @param highPass the lowest frequenzy for the filter
 */

 const getFilteredSource = async (buffer, lowPass, highPass) => {
  // defining context base on buffer
  const context = new OfflineAudioContext(1, buffer.length, buffer.sampleRate);

  // defining low pass filter
  const lowPassFilter = context.createBiquadFilter();
  lowPassFilter.type = 'lowpass';
  lowPassFilter.frequency.setValueAtTime(lowPass, context.currentTime);

  // defining high pass filter
  const highPassFilter = context.createBiquadFilter();
  highPassFilter.type = 'highpass';
  highPassFilter.frequency.setValueAtTime(highPass, context.currentTime);

  // defing source node
  const node = context.createBufferSource();
  node.buffer = buffer;

  // connecting filters with node and destination
  node.connect(lowPassFilter);
  lowPassFilter.connect(highPassFilter);
  highPassFilter.connect(context.destination);

  node.start(0);
  // return
  return node.buffer.getChannelData(0);
};

/**
 * Return BPM of song data
 * @param song Url to song
 */
const getBPM = async (context, buffer) => {
  const decodedBuffer = await context.decodeAudioData(
    buffer,
    decoded => {
      return decoded;
    },
    error => {
      console.log(error);
    },
  );

  console.log(decodedBuffer);

  // Don't think the filters doing so much work just yet, but it's working
  const lowSource = await getFilteredSource(decodedBuffer, 40, 130);
  const midSource = await getFilteredSource(decodedBuffer, 300, 750);

  const peaks = [await getPeaks(lowSource), await getPeaks(midSource)];

  // Loop through peaks data
  const tempos = [];
  peaks.forEach(p => {
    const i = getIntervals(p);

    // get BPM from the five most frequent intervals
    const t = getTempos(i, context.sampleRate).slice(0, 5);
    tempos.push(t);
  });

  // Check both sources peaks and add them together
  const addedTempos = [];
  tempos.forEach(tempo => {
    tempo.forEach(t => {
      let newTempo = addedTempos.some(tempo => {
        if (tempo.tempo === t.tempo) {
          return (tempo.count += t.count);
        }
      });

      if (!newTempo) {
        addedTempos.push(t);
      }
    });
  });

  // return the most frequent tempo found
  return addedTempos[0].tempo;
};
